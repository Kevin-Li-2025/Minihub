const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    minlength: [1, 'Project title cannot be empty'],
    maxlength: [100, 'Project title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [500, 'Project description cannot exceed 500 characters']
  },
  readme: {
    type: String,
    default: '# Project README\n\nWelcome to this project! Add your documentation here.',
    maxlength: [10000, 'README cannot exceed 10000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    default: 'JavaScript',
    maxlength: [50, 'Language cannot exceed 50 characters']
  },
  stars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  forks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  forkedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 更新 lastUpdated 时间戳
projectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = Date.now();
  }
  next();
});

// 虚拟字段：星标数量
projectSchema.virtual('starCount').get(function() {
  return this.stars.length;
});

// 虚拟字段：分叉数量
projectSchema.virtual('forkCount').get(function() {
  return this.forks.length;
});

// 虚拟字段：协作者数量
projectSchema.virtual('collaboratorCount').get(function() {
  return this.collaborators.length;
});

// 确保虚拟字段在 JSON 序列化时被包含
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// 添加协作者方法
projectSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  // 检查用户是否已经是协作者
  const existingCollaborator = this.collaborators.find(
    col => col.user.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    throw new Error('User is already a collaborator');
  }
  
  // 检查用户是否是所有者
  if (this.owner.toString() === userId.toString()) {
    throw new Error('Owner cannot be added as collaborator');
  }
  
  this.collaborators.push({
    user: userId,
    role: role,
    addedAt: new Date()
  });
  
  return this.save();
};

// 移除协作者方法
projectSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    col => col.user.toString() !== userId.toString()
  );
  return this.save();
};

// 检查用户权限方法
projectSchema.methods.hasPermission = function(userId, requiredRole = 'viewer') {
  // 所有者拥有所有权限
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // 查找协作者
  const collaborator = this.collaborators.find(
    col => col.user.toString() === userId.toString()
  );
  
  if (!collaborator) {
    return false;
  }
  
  // 简单的权限等级检查
  const roleHierarchy = { 'viewer': 1, 'editor': 2, 'admin': 3 };
  return roleHierarchy[collaborator.role] >= roleHierarchy[requiredRole];
};

module.exports = mongoose.model('Project', projectSchema); 