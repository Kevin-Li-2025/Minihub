import axios from 'axios';

// 项目 API
export const projectAPI = {
  // 获取所有项目
  getProjects: async (params = {}) => {
    try {
      const response = await axios.get('/api/projects', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch projects' };
    }
  },

  // 获取用户的项目
  getMyProjects: async () => {
    try {
      const response = await axios.get('/api/projects/my-projects');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch user projects' };
    }
  },

  // 获取单个项目
  getProject: async (id) => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch project' };
    }
  },

  // 创建项目
  createProject: async (projectData) => {
    try {
      const response = await axios.post('/api/projects', projectData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to create project' };
    }
  },

  // 更新项目
  updateProject: async (id, projectData) => {
    try {
      const response = await axios.put(`/api/projects/${id}`, projectData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update project' };
    }
  },

  // 删除项目
  deleteProject: async (id) => {
    try {
      const response = await axios.delete(`/api/projects/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete project' };
    }
  },

  // 添加协作者
  addCollaborator: async (projectId, email, role = 'viewer') => {
    try {
      const response = await axios.post(`/api/projects/${projectId}/collaborators`, {
        email,
        role
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add collaborator' };
    }
  },

  // 移除协作者
  removeCollaborator: async (projectId, collaboratorId) => {
    try {
      const response = await axios.delete(`/api/projects/${projectId}/collaborators/${collaboratorId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove collaborator' };
    }
  }
};

// 用户 API
export const userAPI = {
  // 搜索用户
  searchUsers: async (query) => {
    try {
      const response = await axios.get('/api/auth/users/search', {
        params: { query }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to search users' };
    }
  },

  // 更新用户资料
  updateProfile: async (profileData) => {
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update profile' };
    }
  }
};

// 通用错误处理
export const handleApiError = (error) => {
  if (error.response) {
    // 服务器返回错误状态码
    return error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    // 请求发送但没有收到响应
    return 'Network error. Please check your connection.';
  } else {
    // 其他错误
    return error.message || 'An unexpected error occurred';
  }
}; 