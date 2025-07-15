import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Trash2, Shield, GitMerge, Users, Code, Clock } from 'lucide-react';
import axios from 'axios';

const BranchManager = ({ projectId, currentBranch, onBranchChange }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchSource, setNewBranchSource] = useState('main');
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, [projectId]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectId}/branches`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) return;

    try {
      await axios.post(`/api/projects/${projectId}/branches`, {
        name: newBranchName,
        source: newBranchSource
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setNewBranchName('');
      setShowCreateBranch(false);
      fetchBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Error creating branch: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteBranch = async (branchName) => {
    if (branchName === 'main') {
      alert('Cannot delete the main branch');
      return;
    }

    if (branchName === currentBranch) {
      alert('Cannot delete the current branch');
      return;
    }

    if (!confirm(`Are you sure you want to delete branch "${branchName}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/projects/${projectId}/branches/${branchName}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Error deleting branch: ' + (error.response?.data?.message || error.message));
    }
  };

  const switchBranch = (branchName) => {
    if (onBranchChange) {
      onBranchChange(branchName);
    }
  };

  const toggleProtection = async (branchName) => {
    try {
      const branch = branches.find(b => b.name === branchName);
      await axios.patch(`/api/projects/${projectId}/branches/${branchName}`, {
        protected: !branch.protected
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchBranches();
    } catch (error) {
      console.error('Error updating branch protection:', error);
      alert('Error updating branch protection: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <GitBranch className="w-6 h-6 mr-2" />
          Branches ({branches.length})
        </h3>
        <button
          onClick={() => setShowCreateBranch(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Branch
        </button>
      </div>

      {/* Branch List */}
      <div className="space-y-3">
        {branches.map(branch => (
          <div
            key={branch.name}
            className={`p-4 border rounded-lg transition-colors ${
              branch.name === currentBranch 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <GitBranch className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium text-lg">{branch.name}</span>
                  
                  {branch.name === currentBranch && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Current
                    </span>
                  )}
                  
                  {branch.protected && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Protected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Code className="w-3 h-3 mr-1" />
                    {branch.stats?.commits || 0} commits
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Updated {formatDate(branch.lastActivity)}
                  </div>
                  <div className="flex items-center">
                    <GitMerge className="w-3 h-3 mr-1" />
                    {branch.stats?.ahead || 0} ahead, {branch.stats?.behind || 0} behind
                  </div>
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {branch.stats?.contributors || 0} contributors
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {branch.name !== currentBranch && (
                  <button
                    onClick={() => switchBranch(branch.name)}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Switch
                  </button>
                )}

                <button
                  onClick={() => toggleProtection(branch.name)}
                  className={`px-3 py-1 text-sm rounded ${
                    branch.protected 
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {branch.protected ? 'Unprotect' : 'Protect'}
                </button>

                {branch.name !== 'main' && (
                  <button
                    onClick={() => deleteBranch(branch.name)}
                    className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Branch Modal */}
      {showCreateBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Branch</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Name
              </label>
              <input
                type="text"
                placeholder="feature/new-feature"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Branch
              </label>
              <select
                value={newBranchSource}
                onChange={(e) => setNewBranchSource(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {branches.map(branch => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateBranch(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={createBranch}
                disabled={!newBranchName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManager; 