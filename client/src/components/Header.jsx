import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, Plus, LogOut, Settings, Github } from 'lucide-react';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Github className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">MiniHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/projects" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Explore
            </Link>
            
            {isAuthenticated && (
              <>
                <Link 
                  to="/my-projects" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  My Projects
                </Link>
                <Link 
                  to="/create-project" 
                  className="btn btn-primary flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-primary-600" />
                    )}
                  </div>
                  <span className="hidden md:block font-medium">{user?.username}</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <Link
                      to="/my-projects"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      <span>My Projects</span>
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-4">
              <Link 
                to="/projects" 
                onClick={toggleMobileMenu}
                className="block text-gray-600 hover:text-gray-900 transition-colors"
              >
                Explore Projects
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/my-projects" 
                    onClick={toggleMobileMenu}
                    className="block text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    My Projects
                  </Link>
                  <Link 
                    to="/create-project" 
                    onClick={toggleMobileMenu}
                    className="block text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Create Project
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={toggleMobileMenu}
                    className="block text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left text-red-600 hover:text-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={toggleMobileMenu}
                    className="block text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={toggleMobileMenu}
                    className="block text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Close profile menu when clicking outside */}
      {isProfileMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header; 