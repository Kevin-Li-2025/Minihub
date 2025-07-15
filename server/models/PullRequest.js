const mongoose = require('mongoose');

const pullRequestSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  number: {
    type: Number,
    required: [true, 'PR number is required']
  },
  title: {
    type: String,
    required: [true, 'Pull request title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Pull request author is required']
  },
  sourceBranch: {
    type: String,
    required: [true, 'Source branch is required'],
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  targetBranch: {
    type: String,
    required: [true, 'Target branch is required'],
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'merged', 'draft'],
    default: 'open'
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
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reviewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'changes_requested', 'commented'],
      default: 'pending'
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  }],
  commits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commit'
  }],
  changes: {
    filesChanged: {
      type: Number,
      default: 0
    },
    linesAdded: {
      type: Number,
      default: 0
    },
    linesDeleted: {
      type: Number,
      default: 0
    },
    totalCommits: {
      type: Number,
      default: 0
    }
  },
  checks: [{
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failure', 'error'],
      default: 'pending'
    },
    conclusion: {
      type: String,
      maxlength: [200, 'Check conclusion cannot exceed 200 characters']
    },
    url: {
      type: String,
      maxlength: [500, 'Check URL cannot exceed 500 characters']
    }
  }],
  mergeSettings: {
    mergeMethod: {
      type: String,
      enum: ['merge', 'squash', 'rebase'],
      default: 'merge'
    },
    deleteSourceBranch: {
      type: Boolean,
      default: false
    }
  },
  mergedAt: {
    type: Date,
    default: null
  },
  mergedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
pullRequestSchema.index({ project: 1, number: 1 }, { unique: true });

// Index for efficient queries
pullRequestSchema.index({ project: 1, status: 1, createdAt: -1 });
pullRequestSchema.index({ project: 1, author: 1 });
pullRequestSchema.index({ project: 1, assignees: 1 });
pullRequestSchema.index({ project: 1, 'reviewers.user': 1 });
pullRequestSchema.index({ sourceBranch: 1, targetBranch: 1 });

// Virtual for approval status
pullRequestSchema.virtual('approvalStatus').get(function() {
  const approvals = this.reviewers.filter(r => r.status === 'approved').length;
  const changesRequested = this.reviewers.filter(r => r.status === 'changes_requested').length;
  const pending = this.reviewers.filter(r => r.status === 'pending').length;
  
  return {
    approvals,
    changesRequested,
    pending,
    canMerge: changesRequested === 0 && approvals > 0
  };
});

// Virtual for checks status
pullRequestSchema.virtual('checksStatus').get(function() {
  const success = this.checks.filter(c => c.status === 'success').length;
  const failure = this.checks.filter(c => c.status === 'failure').length;
  const pending = this.checks.filter(c => c.status === 'pending').length;
  const error = this.checks.filter(c => c.status === 'error').length;
  
  return {
    total: this.checks.length,
    success,
    failure,
    pending,
    error,
    allPassed: this.checks.length > 0 && failure === 0 && error === 0 && pending === 0
  };
});

// Method to calculate changes statistics
pullRequestSchema.methods.calculateChanges = async function() {
  const Commit = mongoose.model('Commit');
  
  const commits = await Commit.find({
    _id: { $in: this.commits }
  });
  
  this.changes.totalCommits = commits.length;
  this.changes.filesChanged = commits.reduce((sum, commit) => sum + commit.stats.filesChanged, 0);
  this.changes.linesAdded = commits.reduce((sum, commit) => sum + commit.stats.totalLinesAdded, 0);
  this.changes.linesDeleted = commits.reduce((sum, commit) => sum + commit.stats.totalLinesDeleted, 0);
  
  return this.save();
};

// Method to add reviewer
pullRequestSchema.methods.addReviewer = function(userId) {
  const existingReviewer = this.reviewers.find(r => r.user.toString() === userId.toString());
  if (!existingReviewer) {
    this.reviewers.push({
      user: userId,
      status: 'pending'
    });
  }
  return this.save();
};

// Method to update review status
pullRequestSchema.methods.updateReview = function(userId, status) {
  const reviewer = this.reviewers.find(r => r.user.toString() === userId.toString());
  if (reviewer) {
    reviewer.status = status;
    reviewer.reviewedAt = new Date();
  }
  return this.save();
};

// Method to merge pull request
pullRequestSchema.methods.merge = function(mergedBy) {
  this.status = 'merged';
  this.mergedAt = new Date();
  this.mergedBy = mergedBy;
  return this.save();
};

// Method to close pull request
pullRequestSchema.methods.close = function(closedBy) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = closedBy;
  return this.save();
};

// Static method to generate next PR number
pullRequestSchema.statics.getNextNumber = async function(projectId) {
  const lastPR = await this.findOne({ project: projectId })
    .sort({ number: -1 })
    .select('number');
  
  return lastPR ? lastPR.number + 1 : 1;
};

// Pre-save middleware
pullRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.number) {
    this.number = await mongoose.model('PullRequest').getNextNumber(this.project);
  }
  next();
});

module.exports = mongoose.model('PullRequest', pullRequestSchema); 