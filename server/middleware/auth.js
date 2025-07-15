const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'minihub_secret_key_development_only';

// JWT 认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 从数据库获取用户信息
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        error: 'INVALID_TOKEN'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        message: 'Token expired',
        error: 'EXPIRED_TOKEN'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication',
      error: 'AUTH_ERROR'
    });
  }
};

// 可选的认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求，只是不设置用户信息
    next();
  }
};

// 生成 JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' } // 7天过期
  );
};

// 验证 token（不需要数据库查询）
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken,
  JWT_SECRET
}; 