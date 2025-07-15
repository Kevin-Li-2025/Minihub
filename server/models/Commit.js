const mongoose = require('mongoose');
const crypto = require('crypto');

const commitSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  hash: {
    type: String,
    unique: true,
    required: [true, 'Commit hash is required'],
    index: true
  },
  message: {
    type: String,
    required: [true, 'Commit message is required'],
    trim: true,
    maxlength: [500, 'Commit message cannot exceed 500 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Commit author is required']
  },
  branch: {
    type: String,
    required: [true, 'Branch name is required'],
    default: 'main',
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  parentCommits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commit'
  }],
  changes: [{
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    },
    action: {
      type: String,
      enum: ['added', 'modified', 'deleted', 'renamed'],
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    oldPath: {
      type: String, // For renamed files
      default: null
    },
    linesAdded: {
      type: Number,
      default: 0
    },
    linesDeleted: {
      type: Number,
      default: 0
    }
  }],
  stats: {
    filesChanged: {
      type: Number,
      default: 0
    },
    totalLinesAdded: {
      type: Number,
      default: 0
    },
    totalLinesDeleted: {
      type: Number,
      default: 0
    }
  },
  isMergeCommit: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
}, {
  timestamps: true
});

// Index for efficient queries
commitSchema.index({ project: 1, branch: 1, createdAt: -1 });
commitSchema.index({ project: 1, author: 1 });
commitSchema.index({ hash: 1 }, { unique: true });

// Generate commit hash
commitSchema.methods.generateHash = function() {
  const content = `${this.project}${this.message}${this.author}${Date.now()}${Math.random()}`;
  this.hash = crypto.createHash('sha1').update(content).digest('hex').substring(0, 7);
  return this.hash;
};

// Calculate commit statistics
commitSchema.methods.calculateStats = function() {
  this.stats.filesChanged = this.changes.length;
  this.stats.totalLinesAdded = this.changes.reduce((sum, change) => sum + change.linesAdded, 0);
  this.stats.totalLinesDeleted = this.changes.reduce((sum, change) => sum + change.linesDeleted, 0);
};

// Get short hash for display
commitSchema.virtual('shortHash').get(function() {
  return this.hash ? this.hash.substring(0, 7) : '';
});

// Get commit summary
commitSchema.virtual('summary').get(function() {
  const { filesChanged, totalLinesAdded, totalLinesDeleted } = this.stats;
  return `${filesChanged} file${filesChanged !== 1 ? 's' : ''} changed, ${totalLinesAdded} insertion${totalLinesAdded !== 1 ? 's' : ''}(+), ${totalLinesDeleted} deletion${totalLinesDeleted !== 1 ? 's' : ''}(-)`;
});

// Pre-save middleware
commitSchema.pre('save', function(next) {
  if (!this.hash) {
    this.generateHash();
  }
  
  this.calculateStats();
  next();
});

module.exports = mongoose.model('Commit', commitSchema); 