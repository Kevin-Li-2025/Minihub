import React, { useState, useEffect } from 'react';
import { GitCommit, User, Calendar, FileText, Plus, Minus, Code, GitBranch, Clock, Hash } from 'lucide-react';
import axios from 'axios';

const CommitHistory = ({ projectId, currentBranch = 'main' }) => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDiff, setCommitDiff] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchCommits();
    fetchStats();
  }, [projectId, currentBranch]);

  const fetchCommits = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/commits/${projectId}/history`, {
        params: { 
          branch: currentBranch,
          page: pageNum,
          limit: 20
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (pageNum === 1) {
        setCommits(response.data.commits);
      } else {
        setCommits(prev => [...prev, ...response.data.commits]);
      }
      
      setHasMore(response.data.hasMore);
    } catch (error) {
      console.error('Error fetching commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/commits/${projectId}/stats`, {
        params: { branch: currentBranch },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCommitDetails = async (commitSha) => {
    try {
      const response = await axios.get(`/api/commits/${projectId}/${commitSha}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedCommit(response.data);
      setCommitDiff(response.data.changes);
    } catch (error) {
      console.error('Error fetching commit details:', error);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCommits(nextPage);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const renderDiffLine = (line, index) => {
    const type = line.charAt(0);
    let className = 'font-mono text-sm px-4 py-1 ';
    
    if (type === '+') {
      className += 'bg-green-50 text-green-800 border-l-2 border-green-400';
    } else if (type === '-') {
      className += 'bg-red-50 text-red-800 border-l-2 border-red-400';
    } else {
      className += 'bg-gray-50 text-gray-700';
    }

    return (
      <div key={index} className={className}>
        {line}
      </div>
    );
  };

  if (loading && commits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Commit List */}
      <div className="w-1/2 border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <GitCommit className="w-5 h-5 mr-2" />
            Commit History ({currentBranch})
          </h3>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalCommits}</div>
                <div className="text-sm text-gray-600">Total Commits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">+{stats.totalAdditions}</div>
                <div className="text-sm text-gray-600">Lines Added</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">-{stats.totalDeletions}</div>
                <div className="text-sm text-gray-600">Lines Deleted</div>
              </div>
            </div>
          </div>
        )}

        {/* Commit List */}
        <div className="space-y-3">
          {commits.map(commit => (
            <div
              key={commit.sha}
              className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                selectedCommit?.sha === commit.sha ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
              }`}
              onClick={() => fetchCommitDetails(commit.sha)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <GitCommit className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">{commit.message}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {commit.author.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(commit.timestamp)}
                    </div>
                    <div className="flex items-center">
                      <Hash className="w-3 h-3 mr-1" />
                      <code className="bg-gray-100 px-1 rounded text-xs">
                        {commit.sha.substring(0, 8)}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
                    <span className="flex items-center">
                      <Plus className="w-3 h-3 mr-1 text-green-500" />
                      {commit.stats.additions} additions
                    </span>
                    <span className="flex items-center">
                      <Minus className="w-3 h-3 mr-1 text-red-500" />
                      {commit.stats.deletions} deletions
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {commit.stats.files} files
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Commit Details */}
      <div className="flex-1 p-4">
        {selectedCommit ? (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedCommit.message}</h3>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {selectedCommit.sha.substring(0, 12)}
                </code>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Author</div>
                    <div className="flex items-center mt-1">
                      <User className="w-4 h-4 mr-2" />
                      {selectedCommit.author.name}
                      <span className="text-gray-500 ml-2">({selectedCommit.author.email})</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Date</div>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatDate(selectedCommit.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="font-medium text-gray-700 mb-2">Changes</div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center text-green-600">
                      <Plus className="w-4 h-4 mr-1" />
                      {selectedCommit.stats.additions} additions
                    </span>
                    <span className="flex items-center text-red-600">
                      <Minus className="w-4 h-4 mr-1" />
                      {selectedCommit.stats.deletions} deletions
                    </span>
                    <span className="flex items-center text-blue-600">
                      <FileText className="w-4 h-4 mr-1" />
                      {selectedCommit.stats.files} files changed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* File Changes */}
            {commitDiff && commitDiff.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-4 flex items-center">
                  <Code className="w-4 h-4 mr-2" />
                  File Changes
                </h4>
                
                <div className="space-y-4">
                  {commitDiff.map((fileChange, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{fileChange.path}</span>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-green-600">+{fileChange.additions}</span>
                            <span className="text-red-600">-{fileChange.deletions}</span>
                          </div>
                        </div>
                      </div>
                      
                      {fileChange.diff && (
                        <div className="max-h-64 overflow-y-auto">
                          {fileChange.diff.map((line, lineIndex) => 
                            renderDiffLine(line, lineIndex)
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a commit to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommitHistory; 