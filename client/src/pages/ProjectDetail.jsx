import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, userAPI } from '../utils/api';
import Loading from '../components/Loading';
import FileBrowser from '../components/FileBrowser';
import CommitHistory from '../components/CommitHistory';
import BranchManager from '../components/BranchManager';
import IssueTracker from '../components/IssueTracker';
import { 
  User, Calendar, Eye, EyeOff, Edit, Trash2, UserPlus, Star, 
  Users, Code, Tag, AlertCircle, X, Plus, Mail, Crown, Shield, Settings,
  File, GitCommit, GitBranch, BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

const CollaboratorModal = ({ isOpen, onClose, onAdd, projectId }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await projectAPI.addCollaborator(projectId, email, role);
      if (result.success) {
        onAdd(result.data.project);
        setEmail('');
        setRole('viewer');
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to add collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Collaborator</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter collaborator's email"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
            >
              <option value="viewer">Viewer - Can view the project</option>
              <option value="editor">Editor - Can edit the project</option>
              <option value="admin">Admin - Full project access</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Collaborator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [activeTab, setActiveTab] = useState('readme');
  const [currentBranch, setCurrentBranch] = useState('main');

  const fetchProject = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await projectAPI.getProject(id);
      if (result.success) {
        setProject(result.data.project);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await projectAPI.deleteProject(id);
      if (result.success) {
        navigate('/my-projects');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to delete project');
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const updatedData = { isPublic: !project.isPublic };
      const result = await projectAPI.updateProject(id, updatedData);
      
      if (result.success) {
        setProject(result.data.project);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update project visibility');
    }
  };

  const removeCollaborator = async (collaboratorId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const result = await projectAPI.removeCollaborator(id, collaboratorId);
      if (result.success) {
        setProject(result.data.project);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to remove collaborator');
    }
  };

  const toggleStar = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const result = await projectAPI.toggleStar(id);
      if (result.success) {
        setProject(result.data.project);
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleBranchChange = (branchName) => {
    setCurrentBranch(branchName);
  };

  const tabs = [
    { id: 'readme', label: 'README', icon: BookOpen },
    { id: 'files', label: 'Files', icon: File },
    { id: 'commits', label: 'Commits', icon: GitCommit },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'issues', label: 'Issues', icon: AlertCircle }
  ];

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Project not found</p>
        </div>
      </div>
    );
  }

  const canEdit = isAuthenticated && (project.owner._id === user?._id || 
    project.collaborators?.some(c => c.user._id === user?._id && ['admin', 'editor'].includes(c.role)));

  const isOwner = isAuthenticated && project.owner._id === user?._id;
  const isStarred = project.stars?.some(s => s._id === user?._id);

  const getUserRole = () => {
    if (!isAuthenticated) return null;
    if (isOwner) return 'owner';
    const collaboration = project.collaborators?.find(c => c.user._id === user?._id);
    return collaboration?.role || null;
  };

  const userRole = getUserRole();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'readme':
        return (
          <div className="bg-white rounded-lg p-6">
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>
                {project.readme || `# ${project.title}\n\n${project.description || 'No description provided.'}`}
              </ReactMarkdown>
            </div>
          </div>
        );
      case 'files':
        return (
          <div className="bg-white rounded-lg h-[600px]">
            <FileBrowser projectId={id} currentBranch={currentBranch} />
          </div>
        );
      case 'commits':
        return (
          <div className="bg-white rounded-lg h-[600px]">
            <CommitHistory projectId={id} currentBranch={currentBranch} />
          </div>
        );
      case 'branches':
        return (
          <div className="bg-white rounded-lg">
            <BranchManager 
              projectId={id} 
              currentBranch={currentBranch} 
              onBranchChange={handleBranchChange} 
            />
          </div>
        );
      case 'issues':
        return (
          <div className="bg-white rounded-lg h-[600px]">
            <IssueTracker projectId={id} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="text-gray-600 mt-1">{project.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleStar}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                isStarred
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Star className={`h-4 w-4 mr-1 ${isStarred ? 'fill-current' : ''}`} />
              {project.stars?.length || 0}
            </button>

            {canEdit && (
              <Link
                to={`/projects/${id}/edit`}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            )}

            {isOwner && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleVisibility}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {project.isPublic ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  {project.isPublic ? 'Public' : 'Private'}
                </button>

                <button
                  onClick={() => setShowCollaboratorModal(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Collaborator
                </button>

                <button
                  onClick={handleDeleteProject}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            <Link to={`/profile/${project.owner._id}`} className="text-blue-600 hover:text-blue-800">
              {project.owner.name}
            </Link>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Created {formatDistanceToNow(new Date(project.createdAt))} ago
          </div>
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-1" />
            {project.language}
          </div>
          <div className="flex items-center">
            {project.isPublic ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
            {project.isPublic ? 'Public' : 'Private'}
          </div>
          {userRole && (
            <div className="flex items-center">
              <Crown className="h-4 w-4 mr-1" />
              Your role: {userRole}
            </div>
          )}
        </div>

        {/* Branch Selector */}
        <div className="mt-4 flex items-center">
          <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">Branch:</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
            {currentBranch}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {renderTabContent()}
        </div>
      </div>

      {/* Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Main content is in tabs above */}
        </div>

        <div className="space-y-6">
          {/* Collaborators */}
          {project.collaborators && project.collaborators.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaborators</h3>
              <div className="space-y-2">
                {project.collaborators.map((collaborator) => (
                  <div key={collaborator.user._id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {collaborator.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <Link
                          to={`/profile/${collaborator.user._id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {collaborator.user.name}
                        </Link>
                        <p className="text-xs text-gray-500">{collaborator.role}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => removeCollaborator(collaborator.user._id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">{formatDistanceToNow(new Date(project.createdAt))} ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last updated</span>
                <span className="font-medium">{formatDistanceToNow(new Date(project.lastUpdated))} ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Language</span>
                <span className="font-medium">{project.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visibility</span>
                <span className="font-medium">{project.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collaborator Modal */}
      <CollaboratorModal
        isOpen={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        onAdd={(updatedProject) => setProject(updatedProject)}
        projectId={id}
      />
    </div>
  );
};

export default ProjectDetail; 