import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Header from './components/Header';
import Loading from './components/Loading';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import MyProjects from './pages/MyProjects';
import Profile from './pages/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to projects if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/projects" />;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Project Routes (可访问但需要认证来查看私有项目) */}
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          
          {/* Protected Routes */}
          <Route path="/create-project" element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          } />
          <Route path="/my-projects" element={
            <ProtectedRoute>
              <MyProjects />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            <div className="text-center py-16">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Page not found</p>
              <a href="/" className="btn btn-primary">
                Go Home
              </a>
            </div>
          } />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 MiniHub. Made with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 