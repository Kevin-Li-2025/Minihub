import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../utils/api';
import Loading from '../components/Loading';
import { Plus, Calendar, Users, Eye, EyeOff, Edit, Trash2, Crown, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ProjectCard = ({ project, isOwner, onDelete }) => {
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await projectAPI.deleteProject(project._id);
      if (result.success) {
        onDelete(project._id);
      } else {
        alert('Failed to delete project: ' + result.error);
      }
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const getUserRole = () => {
    if (isOwner) return 'owner';
    // For collaborated projects, we'd need to check the user's role in collaborators
    return 'collaborator';
  };

  const getRoleDisplay = () => {
    const role = getUserRole();
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            <Crown className="h-3 w-3" />
            <span>Owner</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            <Shield className="h-3 w-3" />
            <span>Admin</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            <Users className="h-3 w-3" />
            <span>Collaborator</span>
          </span>
        );
    }
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Link 
              to={`/projects/${project._id}`}
              className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
            >
              {project.title}
            </Link>
            {!project.isPublic && (
              <EyeOff className="h-4 w-4 text-gray-500" title="Private project" />
            )}
          </div>
          <p className="text-gray-600 mb-2 line-clamp-2">{project.description}</p>
          {getRoleDisplay()}
        </div>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Updated {formatDistanceToNow(new Date(project.lastUpdated))} ago</span>
        </div>
        {project.collaboratorCount > 0 && (
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{project.collaboratorCount} collaborator{project.collaboratorCount !== 1 ? 's' : ''}</span>
          </div>
        )}
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
        <div className="flex items-center space-x-2">
          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
            {project.language || 'JavaScript'}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            project.isPublic 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {project.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link 
            to={`/projects/${project._id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View
          </Link>
          
          {(isOwner || getUserRole() === 'admin' || getUserRole() === 'editor') && (
            <Link 
              to={`/projects/${project._id}/edit`}
              className="text-gray-600 hover:text-gray-900"
              title="Edit project"
            >
              <Edit className="h-4 w-4" />
            </Link>
          )}
          
          {isOwner && (
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
              title="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MyProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState({ owned: [], collaborated: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('owned');

  const fetchProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await projectAPI.getMyProjects();
      if (result.success) {
        setProjects({
          owned: result.data.ownedProjects,
          collaborated: result.data.collaboratedProjects
        });
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
  }, []);

  const handleProjectDelete = (projectId) => {
    setProjects(prev => ({
      ...prev,
      owned: prev.owned.filter(p => p._id !== projectId)
    }));
  };

  const totalProjects = projects.owned.length + projects.collaborated.length;

  if (loading) {
    return <Loading text="Loading your projects..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">
            Manage your projects and collaborate with others
          </p>
        </div>
        
        <Link to="/create-project" className="btn btn-primary flex items-center space-x-2 mt-4 md:mt-0">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {projects.owned.length}
          </div>
          <div className="text-gray-600">Projects Owned</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {projects.collaborated.length}
          </div>
          <div className="text-gray-600">Collaborations</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {totalProjects}
          </div>
          <div className="text-gray-600">Total Projects</div>
        </div>
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchProjects} className="btn btn-primary">
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('owned')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'owned'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Owned Projects ({projects.owned.length})
              </button>
              <button
                onClick={() => setActiveTab('collaborated')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'collaborated'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Collaborations ({projects.collaborated.length})
              </button>
            </nav>
          </div>

          {/* Project Grid */}
          <div className="space-y-6">
            {activeTab === 'owned' ? (
              projects.owned.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.owned.map(project => (
                    <ProjectCard 
                      key={project._id} 
                      project={project} 
                      isOwner={true}
                      onDelete={handleProjectDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <Plus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first project to get started.
                    </p>
                    <Link to="/create-project" className="btn btn-primary">
                      Create Your First Project
                    </Link>
                  </div>
                </div>
              )
            ) : (
              projects.collaborated.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.collaborated.map(project => (
                    <ProjectCard 
                      key={project._id} 
                      project={project} 
                      isOwner={false}
                      onDelete={() => {}} // Collaborators can't delete
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No collaborations yet</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't been invited to collaborate on any projects yet.
                    </p>
                    <Link to="/projects" className="btn btn-primary">
                      Explore Projects
                    </Link>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyProjects; 