const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Branch description cannot exceed 200 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isProtected: {
    type: Boolean,
    default: false
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Branch creator is required']
  },
  lastCommit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commit',
    default: null
  },
  parentBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  stats: {
    totalCommits: {
      type: Number,
      default: 0
    },
    commitsAhead: {
      type: Number,
      default: 0
    },
    commitsBehind: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  mergeSettings: {
    requirePullRequest: {
      type: Boolean,
      default: false
    },
    requireReviews: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    allowForcePush: {
      type: Boolean,
      default: true
    },
    deleteAfterMerge: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Compound index for uniqueness
branchSchema.index({ project: 1, name: 1 }, { unique: true });

// Index for efficient queries
branchSchema.index({ project: 1, isDefault: 1 });
branchSchema.index({ project: 1, creator: 1 });
branchSchema.index({ project: 1, 'stats.lastActivity': -1 });

// Virtual for branch status
branchSchema.virtual('status').get(function() {
  if (this.isDefault) return 'default';
  if (this.isProtected) return 'protected';
  if (this.stats.commitsAhead > 0) return 'ahead';
  if (this.stats.commitsBehind > 0) return 'behind';
  return 'up-to-date';
});

// Method to update branch statistics
branchSchema.methods.updateStats = async function() {
  const Commit = mongoose.model('Commit');
  
  // Count total commits in this branch
  const totalCommits = await Commit.countDocuments({
    project: this.project,
    branch: this.name
  });
  
  this.stats.totalCommits = totalCommits;
  
  // Update last activity
  const lastCommit = await Commit.findOne({
    project: this.project,
    branch: this.name
  }).sort({ createdAt: -1 });
  
  if (lastCommit) {
    this.stats.lastActivity = lastCommit.createdAt;
    this.lastCommit = lastCommit._id;
  }
  
  return this.save();
};

// Method to calculate commits ahead/behind
branchSchema.methods.calculateDifference = async function(targetBranch) {
  const Commit = mongoose.model('Commit');
  
  const [thisCommits, targetCommits] = await Promise.all([
    Commit.find({ 
      project: this.project, 
      branch: this.name 
    }).select('hash createdAt').sort({ createdAt: -1 }),
    
    Commit.find({ 
      project: this.project, 
      branch: targetBranch 
    }).select('hash createdAt').sort({ createdAt: -1 })
  ]);
  
  const thisHashes = new Set(thisCommits.map(c => c.hash));
  const targetHashes = new Set(targetCommits.map(c => c.hash));
  
  // Commits ahead: in this branch but not in target
  this.stats.commitsAhead = thisCommits.filter(c => !targetHashes.has(c.hash)).length;
  
  // Commits behind: in target but not in this branch
  this.stats.commitsBehind = targetCommits.filter(c => !thisHashes.has(c.hash)).length;
  
  return this.save();
};

// Static method to get default branch
branchSchema.statics.getDefault = function(projectId) {
  return this.findOne({ project: projectId, isDefault: true });
};

// Static method to create main branch
branchSchema.statics.createMain = function(projectId, creatorId) {
  return this.create({
    project: projectId,
    name: 'main',
    description: 'Main branch',
    isDefault: true,
    isProtected: true,
    creator: creatorId
  });
};

// Pre-save middleware
branchSchema.pre('save', function(next) {
  // Only one default branch per project
  if (this.isDefault && this.isModified('isDefault')) {
    mongoose.model('Branch').updateMany(
      { project: this.project, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  
  next();
});

module.exports = mongoose.model('Branch', branchSchema); 