import React, { useState, useEffect } from 'react';
import { AlertCircle, Bug, Lightbulb, Plus, Filter, Search, User, Calendar, Tag, MessageCircle, ThumbsUp, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';

const IssueTracker = ({ projectId }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    type: 'bug',
    priority: 'medium',
    labels: []
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-green-100 text-green-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  const typeIcons = {
    bug: Bug,
    feature: Lightbulb,
    enhancement: AlertCircle
  };

  useEffect(() => {
    fetchIssues();
  }, [projectId, filterStatus, filterType, searchTerm]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/api/projects/${projectId}/issues?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const createIssue = async () => {
    try {
      await axios.post(`/api/projects/${projectId}/issues`, newIssue, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNewIssue({
        title: '',
        description: '',
        type: 'bug',
        priority: 'medium',
        labels: []
      });
      setShowCreateIssue(false);
      fetchIssues();
    } catch (error) {
      console.error('Error creating issue:', error);
      alert('Error creating issue: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateIssueStatus = async (issueId, status) => {
    try {
      await axios.patch(`/api/projects/${projectId}/issues/${issueId}`, {
        status
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchIssues();
      if (selectedIssue && selectedIssue._id === issueId) {
        setSelectedIssue({ ...selectedIssue, status });
      }
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const addComment = async (issueId, comment) => {
    try {
      await axios.post(`/api/projects/${projectId}/issues/${issueId}/comments`, {
        comment
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Refresh issue details
      if (selectedIssue && selectedIssue._id === issueId) {
        fetchIssueDetails(issueId);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const fetchIssueDetails = async (issueId) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedIssue(response.data);
    } catch (error) {
      console.error('Error fetching issue details:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const filteredIssues = issues.filter(issue => {
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
    if (filterType !== 'all' && issue.type !== filterType) return false;
    if (searchTerm && !issue.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !issue.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Issues List */}
      <div className="w-1/2 border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Issues ({filteredIssues.length})
          </h3>
          <button
            onClick={() => setShowCreateIssue(true)}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Issue
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded"
            >
              <option value="all">All Types</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="enhancement">Enhancement</option>
            </select>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-3">
          {filteredIssues.map(issue => {
            const TypeIcon = typeIcons[issue.type] || AlertCircle;
            
            return (
              <div
                key={issue._id}
                className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                  selectedIssue?._id === issue._id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => fetchIssueDetails(issue._id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <TypeIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium">{issue.title}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${statusColors[issue.status]}`}>
                    {issue.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded ${priorityColors[issue.priority]}`}>
                      {issue.priority}
                    </span>
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {issue.author?.name}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(issue.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {issue.comments?.length || 0}
                    </span>
                    <span className="flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {issue.reactions?.length || 0}
                    </span>
                  </div>
                </div>

                {issue.labels && issue.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {issue.labels.map((label, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Issue Details */}
      <div className="flex-1 p-4">
        {selectedIssue ? (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedIssue.title}</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedIssue.status}
                    onChange={(e) => updateIssueStatus(selectedIssue._id, e.target.value)}
                    className="p-2 border border-gray-300 rounded"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span className={`px-2 py-1 text-xs rounded ${priorityColors[selectedIssue.priority]}`}>
                  {selectedIssue.priority} priority
                </span>
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {selectedIssue.author?.name}
                </span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created {formatDate(selectedIssue.createdAt)}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="whitespace-pre-wrap">{selectedIssue.description}</p>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-lg font-semibold mb-4">
                Comments ({selectedIssue.comments?.length || 0})
              </h4>

              <div className="space-y-4 mb-6">
                {selectedIssue.comments?.map((comment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{comment.author?.name}</span>
                      <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border border-gray-200 rounded-lg p-4">
                <textarea
                  placeholder="Add a comment..."
                  className="w-full p-2 border border-gray-300 rounded mb-2"
                  rows={3}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      addComment(selectedIssue._id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      const textarea = e.target.previousElementSibling;
                      addComment(selectedIssue._id, textarea.value);
                      textarea.value = '';
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an issue to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Issue Modal */}
      {showCreateIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Issue</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded h-24"
                  placeholder="Detailed description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newIssue.type}
                    onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="bug">Bug</option>
                    <option value="feature">Feature</option>
                    <option value="enhancement">Enhancement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newIssue.priority}
                    onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateIssue(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={createIssue}
                disabled={!newIssue.title.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                Create Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTracker; 