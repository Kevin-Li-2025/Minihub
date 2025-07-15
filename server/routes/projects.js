const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Branch = require('../models/Branch');
const File = require('../models/File');
const Commit = require('../models/Commit');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 获取所有项目（支持分页和搜索）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      tag = '',
      language = '',
      sortBy = 'lastUpdated',
      sortOrder = 'desc'
    } = req.query;

    // 构建搜索条件
    const searchConditions = {
      isPublic: true // 只显示公开项目
    };

    if (search) {
      searchConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (tag) {
      searchConditions.tags = { $in: [tag] };
    }

    if (language) {
      searchConditions.language = language;
    }

    // 排序条件
    const sortConditions = {};
    sortConditions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 分页计算
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询项目
    const projects = await Project.find(searchConditions)
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar')
      .sort(sortConditions)
      .skip(skip)
      .limit(parseInt(limit));

    // 计算总数
    const total = await Project.countDocuments(searchConditions);

    res.json({
      message: 'Projects retrieved successfully',
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProjects: total,
        hasNext: skip + projects.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      message: 'Error retrieving projects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 获取用户的项目
router.get('/my-projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // 获取用户拥有的项目
    const ownedProjects = await Project.find({ owner: userId })
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar')
      .sort({ lastUpdated: -1 });

    // 获取用户协作的项目
    const collaboratedProjects = await Project.find({
      'collaborators.user': userId
    })
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar')
      .sort({ lastUpdated: -1 });

    res.json({
      message: 'User projects retrieved successfully',
      ownedProjects,
      collaboratedProjects
    });

  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      message: 'Error retrieving user projects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 创建新项目
router.post('/', [
  authenticateToken,
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project title must be between 1 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Project description must be between 1 and 500 characters'),
  body('readme').optional().isLength({ max: 10000 }).withMessage('README cannot exceed 10000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('language').optional().isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, readme, tags, language, isPublic } = req.body;
    const userId = req.user._id;

    // 创建项目
    const project = new Project({
      title,
      description,
      readme: readme || `# ${title}\n\n${description}\n\n## Getting Started\n\nWelcome to this project!`,
      tags: tags || [],
      language: language || 'JavaScript',
      isPublic: isPublic !== undefined ? isPublic : true,
      owner: userId
    });

    await project.save();

    // Create main branch
    const mainBranch = await Branch.createMain(project._id, userId);

    // Create initial README file
    const readmeContent = readme || `# ${title}\n\n${description}\n\n## Getting Started\n\nWelcome to this project!`;
    const readmeFile = new File({
      project: project._id,
      name: 'README.md',
      path: '/',
      content: readmeContent,
      branch: 'main',
      type: 'file'
    });

    await readmeFile.save();

    // Create initial commit with proper file reference
    const initialCommit = new Commit({
      project: project._id,
      message: 'Initial commit',
      author: userId,
      branch: 'main',
      changes: [{
        file: readmeFile._id,
        action: 'added',
        filePath: '/README.md',
        linesAdded: readmeContent.split('\n').length,
        linesDeleted: 0
      }]
    });

    // Explicitly generate hash before saving
    initialCommit.generateHash();
    await initialCommit.save();

    // Update file's last commit and branch stats
    readmeFile.lastCommit = initialCommit._id;
    await readmeFile.save();

    await mainBranch.updateStats();

    // 填充关联数据
    await project.populate('owner', 'username avatar');

    res.status(201).json({
      message: 'Project created successfully',
      project,
      branch: mainBranch,
      initialCommit: {
        hash: initialCommit.hash,
        message: initialCommit.message
      }
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      message: 'Error creating project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 获取单个项目详情
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid project ID'),
  optionalAuth
], async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const userId = req.user?._id;

    const project = await Project.findById(projectId)
      .populate('owner', 'username avatar bio location')
      .populate('collaborators.user', 'username avatar');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    // 检查访问权限（私有项目）
    if (!project.isPublic) {
      if (!userId) {
        return res.status(401).json({
          message: 'Authentication required to view private project'
        });
      }

      const hasAccess = project.owner._id.toString() === userId.toString() ||
                       project.collaborators.some(col => col.user._id.toString() === userId.toString());

      if (!hasAccess) {
        return res.status(403).json({
          message: 'Access denied to private project'
        });
      }
    }

    // 添加用户权限信息
    const userRole = userId ? (
      project.owner._id.toString() === userId.toString() ? 'owner' :
      project.collaborators.find(col => col.user._id.toString() === userId.toString())?.role || null
    ) : null;

    res.json({
      message: 'Project retrieved successfully',
      project: {
        ...project.toObject(),
        userRole
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      message: 'Error retrieving project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 更新项目
router.put('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Project description must be between 1 and 500 characters'),
  body('readme').optional().isLength({ max: 10000 }).withMessage('README cannot exceed 10000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('language').optional().isLength({ max: 50 }).withMessage('Language cannot exceed 50 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const userId = req.user._id;
    const updateData = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    // 检查权限（只有所有者和管理员可以更新）
    if (!project.hasPermission(userId, 'admin')) {
      return res.status(403).json({
        message: 'Access denied: insufficient permissions'
      });
    }

    // 更新项目
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'username avatar').populate('collaborators.user', 'username avatar');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      message: 'Error updating project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 删除项目
router.delete('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid project ID')
], async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    // 只有所有者可以删除项目
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Access denied: only project owner can delete'
      });
    }

    await Project.findByIdAndDelete(projectId);

    res.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      message: 'Error deleting project',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 添加协作者
router.post('/:id/collaborators', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const { email, role = 'viewer' } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    // 检查权限（所有者和管理员可以添加协作者）
    if (!project.hasPermission(userId, 'admin')) {
      return res.status(403).json({
        message: 'Access denied: insufficient permissions'
      });
    }

    // 查找要添加的用户
    const collaboratorUser = await User.findOne({ email });
    if (!collaboratorUser) {
      return res.status(404).json({
        message: 'User not found with this email'
      });
    }

    // 添加协作者
    await project.addCollaborator(collaboratorUser._id, role);

    // 重新获取更新后的项目
    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar email');

    res.json({
      message: 'Collaborator added successfully',
      project: updatedProject
    });

  } catch (error) {
    if (error.message === 'User is already a collaborator' || error.message === 'Owner cannot be added as collaborator') {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error('Add collaborator error:', error);
    res.status(500).json({
      message: 'Error adding collaborator',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 移除协作者
router.delete('/:id/collaborators/:collaboratorId', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid project ID'),
  param('collaboratorId').isMongoId().withMessage('Invalid collaborator ID')
], async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const collaboratorId = req.params.collaboratorId;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    // 检查权限（所有者和管理员可以移除协作者，或者协作者可以移除自己）
    const canRemove = project.hasPermission(userId, 'admin') || collaboratorId === userId.toString();
    
    if (!canRemove) {
      return res.status(403).json({
        message: 'Access denied: insufficient permissions'
      });
    }

    // 移除协作者
    await project.removeCollaborator(collaboratorId);

    // 重新获取更新后的项目
    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'username avatar')
      .populate('collaborators.user', 'username avatar email');

    res.json({
      message: 'Collaborator removed successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      message: 'Error removing collaborator',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get project branches
router.get('/:id/branches', [
  param('id').isMongoId().withMessage('Invalid project ID'),
  optionalAuth
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const userId = req.user?._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access permissions
    if (!project.isPublic && (!userId || !project.hasPermission(userId, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const branches = await Branch.find({ project: projectId })
      .populate('creator', 'username avatar')
      .populate('lastCommit', 'hash message createdAt')
      .sort({ isDefault: -1, name: 1 });

    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      message: 'Error retrieving branches',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new branch
router.post('/:id/branches', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid project ID'),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Branch name must be between 1 and 100 characters'),
  body('source').optional().trim().isLength({ max: 100 }).withMessage('Source branch name cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const { name, source = 'main', description } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (editor or above)
    if (!project.hasPermission(userId, 'editor')) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // Check if branch already exists
    const existingBranch = await Branch.findOne({ project: projectId, name });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch already exists' });
    }

    // Get source branch for copying files
    const sourceBranch = await Branch.findOne({ project: projectId, name: source });
    if (!sourceBranch) {
      return res.status(404).json({ message: 'Source branch not found' });
    }

    // Create new branch
    const branch = new Branch({
      project: projectId,
      name,
      description,
      creator: userId,
      parentBranch: sourceBranch._id
    });

    await branch.save();

    // Copy files from source branch
    const sourceFiles = await File.find({
      project: projectId,
      branch: source,
      isDeleted: false
    });

    for (const sourceFile of sourceFiles) {
      const newFile = new File({
        project: projectId,
        path: sourceFile.path,
        name: sourceFile.name,
        content: sourceFile.content,
        type: sourceFile.type,
        extension: sourceFile.extension,
        size: sourceFile.size,
        language: sourceFile.language,
        branch: name,
        parentDirectory: sourceFile.parentDirectory
      });
      await newFile.save();
    }

    await branch.populate('creator', 'username avatar');
    await branch.updateStats();

    res.status(201).json(branch);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({
      message: 'Error creating branch',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update branch (protection settings, etc.)
router.patch('/:id/branches/:branchName', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid project ID'),
  param('branchName').trim().isLength({ min: 1, max: 100 }).withMessage('Branch name must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const branchName = req.params.branchName;
    const { protected: isProtected, description } = req.body;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (admin or above)
    if (!project.hasPermission(userId, 'admin')) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    const branch = await Branch.findOne({ project: projectId, name: branchName });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Update fields
    if (isProtected !== undefined) branch.isProtected = isProtected;
    if (description !== undefined) branch.description = description;

    await branch.save();
    await branch.populate('creator', 'username avatar');

    res.json(branch);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({
      message: 'Error updating branch',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete branch
router.delete('/:id/branches/:branchName', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid project ID'),
  param('branchName').trim().isLength({ min: 1, max: 100 }).withMessage('Branch name must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const projectId = req.params.id;
    const branchName = req.params.branchName;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions (admin or above)
    if (!project.hasPermission(userId, 'admin')) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    const branch = await Branch.findOne({ project: projectId, name: branchName });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Prevent deletion of default branch
    if (branch.isDefault) {
      return res.status(400).json({ message: 'Cannot delete default branch' });
    }

    // Prevent deletion of protected branch
    if (branch.isProtected) {
      return res.status(400).json({ message: 'Cannot delete protected branch' });
    }

    await Branch.findByIdAndDelete(branch._id);

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({
      message: 'Error deleting branch',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 