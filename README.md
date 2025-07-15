# MiniHub

🧩 **MiniHub** 是一个迷你 GitHub 风格的平台，让用户可以：
- 注册 / 登录
- 创建项目  
- 浏览项目列表
- 查看项目详情（支持 README）
- 添加协作者

## 🧱 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + Axios + React Router |
| 后端 | Node.js + Express |
| 数据库 | MongoDB |
| 登录认证 | JWT + bcrypt |

## 📁 项目结构

```
MiniHub/
├── client/          # React 前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
├── server/          # Express 后端
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── index.js
└── README.md
```

## 🚀 启动项目

### 后端启动
```bash
cd server
npm install
npm start
# 后端运行在 http://localhost:3001
```

### 前端启动
```bash
cd client
npm install
npm run dev
# 前端运行在 http://localhost:5173
```

### 数据库配置
1. 使用 MongoDB Atlas（推荐）：https://www.mongodb.com/cloud/atlas/register
2. 或本地安装 MongoDB
3. 将连接字符串配置到 `server/index.js`

## 📋 功能特性

- ✅ 用户注册/登录（JWT 认证）
- ✅ 创建和管理项目
- ✅ 项目列表浏览
- ✅ 项目详情展示
- ✅ Markdown README 支持
- ✅ 协作者邀请功能
- ✅ 响应式 UI 设计

## 🎯 部署

### 后端部署（Render）
1. 推送代码到 GitHub
2. 在 Render 上连接仓库
3. 设置环境变量 `MONGODB_URI`

### 前端部署（Vercel）
1. 推送代码到 GitHub
2. 在 Vercel 上连接仓库
3. 设置构建命令为 `npm run build`

Ready to showcase your skills! 🔥 