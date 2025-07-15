const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const File = require('../models/File');
const Project = require('../models/Project');
const Commit = require('../models/Commit');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get file tree for project/branch
router.get('/tree/:projectId', [
  param('projectId').isMongoId().withMessage('Invalid project ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const { branch = 'main', path = '/' } = req.query;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get files and directories
    const files = await File.find({
      project: projectId,
      branch: branch,
      path: path,
      isDeleted: false
    })
    .sort({ type: -1, name: 1 }) // directories first, then files alphabetically
    .populate('lastCommit', 'hash message createdAt author')
    .populate('lastCommit.author', 'username');

    res.json({
      message: 'File tree retrieved successfully',
      files,
      path,
      branch
    });

  } catch (error) {
    console.error('Get file tree error:', error);
    res.status(500).json({
      message: 'Error retrieving file tree',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get file content
router.get('/content/:projectId/*', [
  param('projectId').isMongoId().withMessage('Invalid project ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const filePath = req.params[0]; // Everything after projectId
    const { branch = 'main' } = req.query;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the file
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const dirPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';

    const file = await File.findOne({
      project: projectId,
      name: fileName,
      path: dirPath,
      branch: branch,
      type: 'file',
      isDeleted: false
    })
    .populate('lastCommit', 'hash message createdAt author')
    .populate('lastCommit.author', 'username');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({
      message: 'File content retrieved successfully',
      file
    });

  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({
      message: 'Error retrieving file content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create or update file
router.put('/content/:projectId/*', [
  authenticateToken,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  body('content').notEmpty().withMessage('File content is required'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Commit message must be between 1 and 500 characters'),
  body('branch').optional().trim().isLength({ max: 100 }).withMessage('Branch name cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const filePath = req.params[0];
    const { content, message, branch = 'main' } = req.body;
    const userId = req.user._id;

    // Check if project exists and user has edit access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.hasPermission(userId, 'editor')) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // Parse file path
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const dirPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';

    // Find existing file or create new one
    let file = await File.findOne({
      project: projectId,
      name: fileName,
      path: dirPath,
      branch: branch,
      isDeleted: false
    });

    const isNewFile = !file;
    let oldContent = '';

    if (file) {
      oldContent = file.content;
      file.content = content;
    } else {
      file = new File({
        project: projectId,
        name: fileName,
        path: dirPath,
        content: content,
        branch: branch,
        type: 'file'
      });
    }

    await file.save();

    // Create commit
    const commit = new Commit({
      project: projectId,
      message: message,
      author: userId,
      branch: branch,
      changes: [{
        file: file._id,
        action: isNewFile ? 'added' : 'modified',
        filePath: file.fullPath,
        linesAdded: isNewFile ? content.split('\n').length : 0,
        linesDeleted: isNewFile ? 0 : oldContent.split('\n').length
      }]
    });

    await commit.save();

    // Update file's last commit
    file.lastCommit = commit._id;
    await file.save();

    await file.populate('lastCommit', 'hash message createdAt author');
    await file.populate('lastCommit.author', 'username');

    res.json({
      message: isNewFile ? 'File created successfully' : 'File updated successfully',
      file,
      commit: {
        hash: commit.hash,
        message: commit.message
      }
    });

  } catch (error) {
    console.error('Create/update file error:', error);
    res.status(500).json({
      message: 'Error saving file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete file
router.delete('/content/:projectId/*', [
  authenticateToken,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Commit message must be between 1 and 500 characters'),
  body('branch').optional().trim().isLength({ max: 100 }).withMessage('Branch name cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const filePath = req.params[0];
    const { message, branch = 'main' } = req.body;
    const userId = req.user._id;

    // Check if project exists and user has edit access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.hasPermission(userId, 'editor')) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // Parse file path
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const dirPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';

    // Find the file
    const file = await File.findOne({
      project: projectId,
      name: fileName,
      path: dirPath,
      branch: branch,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Mark as deleted
    file.isDeleted = true;
    await file.save();

    // Create commit
    const commit = new Commit({
      project: projectId,
      message: message,
      author: userId,
      branch: branch,
      changes: [{
        file: file._id,
        action: 'deleted',
        filePath: file.fullPath,
        linesAdded: 0,
        linesDeleted: file.content.split('\n').length
      }]
    });

    await commit.save();

    res.json({
      message: 'File deleted successfully',
      commit: {
        hash: commit.hash,
        message: commit.message
      }
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      message: 'Error deleting file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search files
router.get('/search/:projectId', [
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const { q: query, branch = 'main', type } = req.query;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build search conditions
    const searchConditions = {
      project: projectId,
      branch: branch,
      isDeleted: false,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    };

    if (type) {
      searchConditions.type = type;
    }

    const files = await File.find(searchConditions)
      .limit(50) // Limit results for performance
      .populate('lastCommit', 'hash message createdAt author')
      .populate('lastCommit.author', 'username');

    res.json({
      message: 'File search completed',
      files,
      query,
      total: files.length
    });

  } catch (error) {
    console.error('File search error:', error);
    res.status(500).json({
      message: 'Error searching files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 