import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../utils/api';
import Loading from '../components/Loading';
import { Search, Filter, Calendar, User, Tag, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ProjectCard = ({ project }) => {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link 
            to={`/projects/${project._id}`}
            className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {project.title}
          </Link>
          <p className="text-gray-600 mt-1 line-clamp-2">{project.description}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <User className="h-4 w-4" />
          <span>{project.owner?.username || 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>{formatDistanceToNow(new Date(project.lastUpdated))} ago</span>
        </div>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{project.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
            {project.language || 'JavaScript'}
          </span>
          {project.starCount > 0 && (
            <span>★ {project.starCount}</span>
          )}
          {project.collaboratorCount > 0 && (
            <span>{project.collaboratorCount} collaborator{project.collaboratorCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        <Link 
          to={`/projects/${project._id}`}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          View Project →
        </Link>
      </div>
    </div>
  );
};

const ProjectList = () => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState('desc');

  const languages = ['JavaScript', 'Python', 'Java', 'TypeScript', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby'];

  const fetchProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        language: selectedLanguage,
        sortBy,
        sortOrder
      };

      const result = await projectAPI.getProjects(params);
      
      if (result.success) {
        setProjects(result.data.projects);
        setPagination(result.data.pagination);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentPage, searchTerm, selectedLanguage, sortBy, sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProjects();
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  if (loading && currentPage === 1) {
    return <Loading text="Loading projects..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Projects</h1>
          <p className="text-gray-600">
            Discover amazing projects created by the community
          </p>
        </div>
        
        {isAuthenticated && (
          <Link to="/create-project" className="btn btn-primary flex items-center space-x-2 mt-4 md:mt-0">
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="input"
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSortChange('lastUpdated')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'lastUpdated' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Recent {sortBy === 'lastUpdated' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('title')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'title' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Name {sortBy === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchProjects} className="btn btn-primary">
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Project Grid */}
          {projects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or explore different categories.
                </p>
                {isAuthenticated && (
                  <Link to="/create-project" className="btn btn-primary">
                    Create the first project
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev || loading}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!pagination.hasNext || loading}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectList; 