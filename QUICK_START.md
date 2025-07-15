# 🚀 MiniHub 快速启动指南

恭喜！你现在已经有了一个完整的 MiniHub 项目。以下是启动步骤：

## 📋 前置要求

- Node.js 18+ 
- npm 或 yarn
- MongoDB (本地安装或 MongoDB Atlas 账户)

## 🛠️ 快速启动

### 1. 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖  
cd ../client
npm install
```

### 2. 配置数据库

#### 选项 A: 使用 MongoDB Atlas (推荐)
1. 访问 https://www.mongodb.com/cloud/atlas/register
2. 创建免费账户和集群
3. 获取连接字符串
4. 在 `server` 目录创建 `.env` 文件：

```bash
# server/.env
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/minihub
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
NODE_ENV=development
```

#### 选项 B: 使用本地 MongoDB
```bash
# server/.env  
PORT=3001
MONGODB_URI=mongodb://localhost:27017/minihub
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
NODE_ENV=development
```

### 3. 启动应用

打开两个终端窗口：

```bash
# 终端 1: 启动后端
cd server
npm start
# 🚀 Server running on http://localhost:3001

# 终端 2: 启动前端  
cd client
npm run dev
# 🎉 前端运行在 http://localhost:5173
```

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 🎯 测试功能

### 首次使用
1. 点击 "Sign Up" 创建账户
2. 使用邮箱和密码注册
3. 登录后创建第一个项目
4. 尝试添加协作者
5. 编辑个人资料

### 演示数据
你可以创建以下测试账户：
- 邮箱: `demo@minihub.com`  
- 密码: `demo123`

## 📁 项目结构

```
MiniHub/
├── server/           # Express 后端
│   ├── models/       # 数据库模型
│   ├── routes/       # API 路由
│   ├── middleware/   # 中间件
│   └── index.js      # 服务器入口
├── client/           # React 前端
│   ├── src/
│   │   ├── components/  # 可复用组件
│   │   ├── pages/       # 页面组件
│   │   ├── context/     # React Context
│   │   └── utils/       # 工具函数
│   └── public/
└── README.md
```

## 🔧 开发命令

### 后端
```bash
cd server
npm start        # 启动服务器
npm run dev      # 开发模式 (使用 nodemon)
```

### 前端
```bash
cd client  
npm run dev      # 开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

## 🚀 部署准备

### 后端部署 (Render/Railway)
1. 推送代码到 GitHub
2. 连接到部署平台
3. 设置环境变量：
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

### 前端部署 (Vercel/Netlify)
1. 推送代码到 GitHub
2. 连接到部署平台
3. 设置构建命令: `npm run build`
4. 设置输出目录: `dist`

## 🎨 自定义

### 修改样式
- 编辑 `client/src/index.css`
- 修改 Tailwind 配置 `client/tailwind.config.js`

### 添加功能
- 后端: 在 `server/routes/` 添加新路由
- 前端: 在 `client/src/pages/` 添加新页面

### 修改数据模型
- 编辑 `server/models/` 中的 Mongoose 模型

## 🐛 常见问题

### 后端启动失败
- 检查 MongoDB 连接
- 确认 `.env` 文件配置正确
- 查看控制台错误信息

### 前端连接失败
- 确认后端在 3001 端口运行
- 检查 Vite 代理配置 `client/vite.config.js`

### 登录问题
- 确认 JWT_SECRET 设置
- 检查数据库连接
- 清除浏览器 localStorage

## 📖 API 文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 项目接口
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

## 🎉 完成！

你的 MiniHub 现在可以正常运行了！

### 下一步
- 添加更多功能 (文件上传、评论系统等)
- 优化性能和SEO
- 编写测试
- 准备生产部署

---

**祝你在 Buildbook 面试中好运！** 🔥

这个项目展示了你的全栈开发能力：
- ✅ React + 现代前端技术栈
- ✅ Node.js + Express 后端
- ✅ MongoDB 数据库设计
- ✅ JWT 认证和权限控制
- ✅ 响应式UI和用户体验
- ✅ RESTful API 设计
- ✅ 完整的项目结构 