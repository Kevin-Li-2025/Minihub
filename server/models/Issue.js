const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  number: {
    type: Number,
    required: [true, 'Issue number is required']
  },
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [10000, 'Description cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Issue author is required']
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['open', 'closed', 'in_progress', 'resolved'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'enhancement', 'documentation', 'question'],
    default: 'bug'
  },
  labels: [{
    name: {
      type: String,
      required: true,
      maxlength: [50, 'Label name cannot exceed 50 characters']
    },
    color: {
      type: String,
      default: '#007bff',
      match: [/^#[0-9A-F]{6}$/i, 'Invalid color format']
    }
  }],
  milestone: {
    title: {
      type: String,
      maxlength: [100, 'Milestone title cannot exceed 100 characters']
    },
    dueDate: {
      type: Date,
      default: null
    }
  },
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [5000, 'Comment cannot exceed 5000 characters']
    },
    isMinimized: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  linkedPullRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PullRequest'
  }],
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  closedReason: {
    type: String,
    enum: ['completed', 'not_planned', 'duplicate', 'invalid'],
    default: undefined
  },
  reactions: {
    thumbsUp: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    thumbsDown: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    laugh: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    hooray: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    confused: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    heart: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    rocket: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    eyes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
issueSchema.index({ project: 1, number: 1 }, { unique: true });

// Index for efficient queries
issueSchema.index({ project: 1, status: 1, createdAt: -1 });
issueSchema.index({ project: 1, author: 1 });
issueSchema.index({ project: 1, assignees: 1 });
issueSchema.index({ project: 1, type: 1, priority: 1 });
issueSchema.index({ project: 1, 'labels.name': 1 });

// Virtual for comment count
issueSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for total reactions
issueSchema.virtual('reactionCount').get(function() {
  return Object.values(this.reactions).reduce((total, reactions) => total + reactions.length, 0);
});

// Virtual for issue age
issueSchema.virtual('age').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to add comment
issueSchema.methods.addComment = function(authorId, content) {
  this.comments.push({
    author: authorId,
    content: content,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return this.save();
};

// Method to update comment
issueSchema.methods.updateComment = function(commentId, content) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.content = content;
    comment.updatedAt = new Date();
  }
  return this.save();
};

// Method to delete comment
issueSchema.methods.deleteComment = function(commentId) {
  this.comments.id(commentId).remove();
  return this.save();
};

// Method to add reaction
issueSchema.methods.addReaction = function(userId, reactionType) {
  if (!this.reactions[reactionType]) {
    this.reactions[reactionType] = [];
  }
  
  // Remove existing reaction of same type from user
  this.reactions[reactionType] = this.reactions[reactionType].filter(
    id => id.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions[reactionType].push(userId);
  return this.save();
};

// Method to remove reaction
issueSchema.methods.removeReaction = function(userId, reactionType) {
  if (this.reactions[reactionType]) {
    this.reactions[reactionType] = this.reactions[reactionType].filter(
      id => id.toString() !== userId.toString()
    );
  }
  return this.save();
};

// Method to assign user
issueSchema.methods.assign = function(userId) {
  if (!this.assignees.includes(userId)) {
    this.assignees.push(userId);
  }
  return this.save();
};

// Method to unassign user
issueSchema.methods.unassign = function(userId) {
  this.assignees = this.assignees.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to close issue
issueSchema.methods.close = function(closedBy, reason = 'completed') {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = closedBy;
  this.closedReason = reason;
  return this.save();
};

// Method to reopen issue
issueSchema.methods.reopen = function() {
  this.status = 'open';
  this.closedAt = null;
  this.closedBy = null;
  this.closedReason = undefined;
  return this.save();
};

// Method to link pull request
issueSchema.methods.linkPullRequest = function(pullRequestId) {
  if (!this.linkedPullRequests.includes(pullRequestId)) {
    this.linkedPullRequests.push(pullRequestId);
  }
  return this.save();
};

// Static method to generate next issue number
issueSchema.statics.getNextNumber = async function(projectId) {
  const lastIssue = await this.findOne({ project: projectId })
    .sort({ number: -1 })
    .select('number');
  
  return lastIssue ? lastIssue.number + 1 : 1;
};

// Pre-save middleware
issueSchema.pre('save', async function(next) {
  if (this.isNew && !this.number) {
    this.number = await mongoose.model('Issue').getNextNumber(this.project);
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema); 