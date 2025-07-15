const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  location: {
    type: String,
    default: '',
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  website: {
    type: String,
    default: ''
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 如果密码没有被修改，则跳过加密
  if (!this.isModified('password')) return next();
  
  try {
    // 生成盐值并加密密码
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 比较密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 获取公开信息（不包含密码）
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    website: this.website,
    joinedAt: this.joinedAt
  };
};

module.exports = mongoose.model('User', userSchema); 