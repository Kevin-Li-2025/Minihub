const express = require('express');
const { param, query, validationResult } = require('express-validator');
const Commit = require('../models/Commit');
const Project = require('../models/Project');
const File = require('../models/File');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get commit history for project/branch
router.get('/:projectId', [
  optionalAuth,
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
    const { 
      branch = 'main', 
      page = 1, 
      limit = 20,
      author,
      since,
      until 
    } = req.query;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build query conditions
    const queryConditions = {
      project: projectId,
      branch: branch
    };

    if (author) {
      queryConditions.author = author;
    }

    if (since || until) {
      queryConditions.createdAt = {};
      if (since) queryConditions.createdAt.$gte = new Date(since);
      if (until) queryConditions.createdAt.$lte = new Date(until);
    }

    // Get commits with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const commits = await Commit.find(queryConditions)
      .populate('author', 'username avatar email')
      .populate('parentCommits', 'hash message createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Commit.countDocuments(queryConditions);

    res.json({
      message: 'Commits retrieved successfully',
      commits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCommits: total,
        hasNext: skip + commits.length < total,
        hasPrev: parseInt(page) > 1
      },
      branch
    });

  } catch (error) {
    console.error('Get commits error:', error);
    res.status(500).json({
      message: 'Error retrieving commits',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get specific commit details
router.get('/:projectId/:commitHash', [
  optionalAuth,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  param('commitHash').isLength({ min: 7, max: 40 }).withMessage('Invalid commit hash')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId, commitHash } = req.params;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find commit by hash (partial or full)
    const commit = await Commit.findOne({
      project: projectId,
      hash: { $regex: `^${commitHash}`, $options: 'i' }
    })
    .populate('author', 'username avatar email')
    .populate('parentCommits', 'hash message createdAt author')
    .populate('parentCommits.author', 'username')
    .populate('changes.file', 'name path fullPath language');

    if (!commit) {
      return res.status(404).json({ message: 'Commit not found' });
    }

    res.json({
      message: 'Commit details retrieved successfully',
      commit
    });

  } catch (error) {
    console.error('Get commit details error:', error);
    res.status(500).json({
      message: 'Error retrieving commit details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get commit diff
router.get('/:projectId/:commitHash/diff', [
  optionalAuth,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  param('commitHash').isLength({ min: 7, max: 40 }).withMessage('Invalid commit hash')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId, commitHash } = req.params;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find commit
    const commit = await Commit.findOne({
      project: projectId,
      hash: { $regex: `^${commitHash}`, $options: 'i' }
    })
    .populate('changes.file', 'name path content');

    if (!commit) {
      return res.status(404).json({ message: 'Commit not found' });
    }

    // Generate diff for each changed file
    const diffs = [];

    for (const change of commit.changes) {
      if (!change.file) continue;

      let beforeContent = '';
      let afterContent = change.file.content;

      // For modified files, get previous version
      if (change.action === 'modified' && commit.parentCommits.length > 0) {
        // Find previous version of the file
        const previousFile = await File.findOne({
          project: projectId,
          name: change.file.name,
          path: change.file.path,
          lastCommit: { $in: commit.parentCommits }
        });

        if (previousFile) {
          beforeContent = previousFile.content;
        }
      }

      // For deleted files, show the deleted content
      if (change.action === 'deleted') {
        beforeContent = change.file.content;
        afterContent = '';
      }

      diffs.push({
        file: {
          name: change.file.name,
          path: change.filePath,
          language: change.file.language
        },
        action: change.action,
        beforeContent,
        afterContent,
        linesAdded: change.linesAdded,
        linesDeleted: change.linesDeleted
      });
    }

    res.json({
      message: 'Commit diff retrieved successfully',
      commit: {
        hash: commit.hash,
        message: commit.message,
        author: commit.author,
        createdAt: commit.createdAt,
        stats: commit.stats
      },
      diffs
    });

  } catch (error) {
    console.error('Get commit diff error:', error);
    res.status(500).json({
      message: 'Error retrieving commit diff',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Compare commits
router.get('/:projectId/compare/:baseHash...:headHash', [
  optionalAuth,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  param('baseHash').isLength({ min: 7, max: 40 }).withMessage('Invalid base commit hash'),
  param('headHash').isLength({ min: 7, max: 40 }).withMessage('Invalid head commit hash')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { projectId, baseHash, headHash } = req.params;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find both commits
    const [baseCommit, headCommit] = await Promise.all([
      Commit.findOne({
        project: projectId,
        hash: { $regex: `^${baseHash}`, $options: 'i' }
      }).populate('author', 'username'),
      
      Commit.findOne({
        project: projectId,
        hash: { $regex: `^${headHash}`, $options: 'i' }
      }).populate('author', 'username')
    ]);

    if (!baseCommit || !headCommit) {
      return res.status(404).json({ message: 'One or both commits not found' });
    }

    // Get commits between base and head
    const commitsBetween = await Commit.find({
      project: projectId,
      createdAt: {
        $gt: baseCommit.createdAt,
        $lte: headCommit.createdAt
      }
    })
    .populate('author', 'username avatar')
    .sort({ createdAt: 1 });

    // Calculate total changes
    const totalStats = commitsBetween.reduce((acc, commit) => {
      acc.filesChanged += commit.stats.filesChanged;
      acc.linesAdded += commit.stats.totalLinesAdded;
      acc.linesDeleted += commit.stats.totalLinesDeleted;
      return acc;
    }, { filesChanged: 0, linesAdded: 0, linesDeleted: 0 });

    res.json({
      message: 'Commit comparison retrieved successfully',
      baseCommit: {
        hash: baseCommit.hash,
        message: baseCommit.message,
        author: baseCommit.author,
        createdAt: baseCommit.createdAt
      },
      headCommit: {
        hash: headCommit.hash,
        message: headCommit.message,
        author: headCommit.author,
        createdAt: headCommit.createdAt
      },
      commits: commitsBetween,
      stats: {
        ...totalStats,
        totalCommits: commitsBetween.length
      }
    });

  } catch (error) {
    console.error('Compare commits error:', error);
    res.status(500).json({
      message: 'Error comparing commits',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get commit statistics
router.get('/:projectId/stats', [
  optionalAuth,
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
    const { branch = 'main', period = '30' } = req.query;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const periodDays = parseInt(period);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - periodDays);

    // Aggregate commit statistics
    const stats = await Commit.aggregate([
      {
        $match: {
          project: project._id,
          branch: branch,
          createdAt: { $gte: sinceDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCommits: { $sum: 1 },
          totalFilesChanged: { $sum: '$stats.filesChanged' },
          totalLinesAdded: { $sum: '$stats.totalLinesAdded' },
          totalLinesDeleted: { $sum: '$stats.totalLinesDeleted' },
          contributors: { $addToSet: '$author' }
        }
      }
    ]);

    // Get commits by day for activity chart
    const dailyActivity = await Commit.aggregate([
      {
        $match: {
          project: project._id,
          branch: branch,
          createdAt: { $gte: sinceDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          commits: { $sum: 1 },
          linesAdded: { $sum: '$stats.totalLinesAdded' },
          linesDeleted: { $sum: '$stats.totalLinesDeleted' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top contributors
    const topContributors = await Commit.aggregate([
      {
        $match: {
          project: project._id,
          branch: branch,
          createdAt: { $gte: sinceDate }
        }
      },
      {
        $group: {
          _id: '$author',
          commits: { $sum: 1 },
          linesAdded: { $sum: '$stats.totalLinesAdded' },
          linesDeleted: { $sum: '$stats.totalLinesDeleted' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          username: '$user.username',
          avatar: '$user.avatar',
          commits: 1,
          linesAdded: 1,
          linesDeleted: 1
        }
      },
      {
        $sort: { commits: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const result = stats[0] || {
      totalCommits: 0,
      totalFilesChanged: 0,
      totalLinesAdded: 0,
      totalLinesDeleted: 0,
      contributors: []
    };

    res.json({
      message: 'Commit statistics retrieved successfully',
      stats: {
        ...result,
        contributorCount: result.contributors.length,
        period: periodDays,
        branch
      },
      dailyActivity,
      topContributors
    });

  } catch (error) {
    console.error('Get commit stats error:', error);
    res.status(500).json({
      message: 'Error retrieving commit statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 