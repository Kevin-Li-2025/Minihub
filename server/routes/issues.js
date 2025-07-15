const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get all issues for a project
router.get('/:projectId/issues', optionalAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, type, search, page = 1, limit = 20 } = req.query;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build filter
    const filter = { project: projectId };
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const issues = await Issue.find(filter)
      .populate('author', 'username avatar')
      .populate('assignees', 'username avatar')
      .populate('comments.author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single issue
router.get('/:projectId/issues/:issueId', optionalAuth, async (req, res) => {
  try {
    const { projectId, issueId } = req.params;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && (!req.user || !project.hasPermission(req.user._id, 'viewer'))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const issue = await Issue.findById(issueId)
      .populate('author', 'username avatar')
      .populate('assignees', 'username avatar')
      .populate('comments.author', 'username avatar');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new issue
router.post('/:projectId/issues', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, type, priority, labels, milestone } = req.body;

    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isPublic && !project.hasPermission(req.user._id, 'viewer')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const issue = new Issue({
      title,
      description,
      type,
      priority,
      labels: labels || [],
      milestone,
      project: projectId,
      author: req.user._id,
      number: await getNextIssueNumber(projectId)
    });

    await issue.save();
    await issue.populate('author', 'username avatar');

    res.status(201).json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update issue
router.patch('/:projectId/issues/:issueId', authenticateToken, async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status, assignees, priority, labels, milestone } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check permissions
    const project = await Project.findById(issue.project);
    const canEdit = project.hasPermission(req.user._id, 'editor') ||
      issue.author.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (status !== undefined) issue.status = status;
    if (assignees !== undefined) issue.assignees = assignees;
    if (priority !== undefined) issue.priority = priority;
    if (labels !== undefined) issue.labels = labels;
    if (milestone !== undefined) issue.milestone = milestone;

    if (status === 'closed' && issue.status !== 'closed') {
      issue.closedAt = new Date();
    } else if (status !== 'closed') {
      issue.closedAt = null;
    }

    await issue.save();
    await issue.populate('author', 'username avatar');
    await issue.populate('assignees', 'username avatar');

    res.json(issue);
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to issue
router.post('/:projectId/issues/:issueId/comments', authenticateToken, async (req, res) => {
  try {
    const { projectId, issueId } = req.params;
    const { comment } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check access
    const project = await Project.findById(projectId);
    if (!project.isPublic && !project.hasPermission(req.user._id, 'viewer')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    issue.comments.push({
      content: comment,
      author: req.user._id,
      createdAt: new Date()
    });

    await issue.save();
    await issue.populate('comments.author', 'username avatar');

    res.json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reaction to issue
router.post('/:projectId/issues/:issueId/reactions', authenticateToken, async (req, res) => {
  try {
    const { projectId, issueId } = req.params;
    const { reactionType } = req.body;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check access
    const project = await Project.findById(projectId);
    if (!project.isPublic && !project.hasPermission(req.user._id, 'viewer')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user already reacted with this type
    if (issue.reactions[reactionType] && issue.reactions[reactionType].includes(req.user._id)) {
      // Remove reaction
      issue.reactions[reactionType] = issue.reactions[reactionType].filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Add reaction
      if (!issue.reactions[reactionType]) {
        issue.reactions[reactionType] = [];
      }
      issue.reactions[reactionType].push(req.user._id);
    }

    await issue.save();
    res.json({ message: 'Reaction updated successfully' });
  } catch (error) {
    console.error('Error updating reaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete issue
router.delete('/:projectId/issues/:issueId', authenticateToken, async (req, res) => {
  try {
    const { projectId, issueId } = req.params;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check permissions (only owner or admin can delete)
    const project = await Project.findById(projectId);
    const canDelete = project.hasPermission(req.user._id, 'admin');

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Issue.findByIdAndDelete(issueId);
    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get next issue number
async function getNextIssueNumber(projectId) {
  const lastIssue = await Issue.findOne({ project: projectId })
    .sort({ number: -1 })
    .select('number');
  
  return lastIssue ? lastIssue.number + 1 : 1;
}

module.exports = router; 