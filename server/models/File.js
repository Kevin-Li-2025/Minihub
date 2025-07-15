const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
    maxlength: [500, 'File path cannot exceed 500 characters']
  },
  name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  content: {
    type: String,
    default: '',
    maxlength: [1000000, 'File content cannot exceed 1MB'] // 1MB limit
  },
  type: {
    type: String,
    enum: ['file', 'directory'],
    default: 'file'
  },
  extension: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [10, 'File extension cannot exceed 10 characters']
  },
  size: {
    type: Number,
    default: 0
  },
  language: {
    type: String,
    default: 'text',
    maxlength: [50, 'Language cannot exceed 50 characters']
  },
  branch: {
    type: String,
    default: 'main',
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  lastCommit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commit',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  parentDirectory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
fileSchema.index({ project: 1, path: 1, branch: 1 });
fileSchema.index({ project: 1, type: 1, branch: 1 });
fileSchema.index({ project: 1, branch: 1, isDeleted: 1 });

// Virtual for full file path
fileSchema.virtual('fullPath').get(function() {
  return this.path === '/' ? `/${this.name}` : `${this.path}/${this.name}`;
});

// Method to detect programming language
fileSchema.methods.detectLanguage = function() {
  const extensions = {
    'js': 'JavaScript',
    'ts': 'TypeScript', 
    'jsx': 'React JSX',
    'tsx': 'React TSX',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'json': 'JSON',
    'xml': 'XML',
    'md': 'Markdown',
    'yaml': 'YAML',
    'yml': 'YAML',
    'sql': 'SQL',
    'sh': 'Shell',
    'bash': 'Bash'
  };
  
  this.language = extensions[this.extension] || 'Text';
  return this.language;
};

// Method to calculate file size
fileSchema.methods.calculateSize = function() {
  this.size = Buffer.byteLength(this.content, 'utf8');
  return this.size;
};

// Pre-save middleware
fileSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    const parts = this.name.split('.');
    if (parts.length > 1) {
      this.extension = parts.pop().toLowerCase();
    }
    this.detectLanguage();
  }
  
  if (this.isModified('content')) {
    this.calculateSize();
  }
  
  next();
});

module.exports = mongoose.model('File', fileSchema); 