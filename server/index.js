const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 导入路由
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const fileRoutes = require('./routes/files');
const commitRoutes = require('./routes/commits');
const issueRoutes = require('./routes/issues');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', issueRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/commits', commitRoutes);

// 健康检查路由
app.get('/', (req, res) => {
  res.json({ 
    message: 'MiniHub Server is running!', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// MongoDB 连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/minihub';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log(`📍 Database: ${MONGODB_URI}`);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API docs: http://localhost:${PORT}/api`);
}); 