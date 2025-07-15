import React, { useState, useEffect } from 'react';
import { File, Folder, FolderOpen, Plus, Upload, Search, GitBranch, GitCommit, Edit, Trash2, Download } from 'lucide-react';
import axios from 'axios';

const FileBrowser = ({ projectId, currentBranch = 'main' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['']));
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  useEffect(() => {
    fetchFiles();
  }, [projectId, currentBranch]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/files/${projectId}/tree`, {
        params: { branch: currentBranch },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filePath) => {
    try {
      const response = await axios.get(`/api/files/${projectId}/content`, {
        params: { path: filePath, branch: currentBranch },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFileContent(response.data.content);
      setSelectedFile(response.data);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const saveFileContent = async () => {
    try {
      await axios.put(`/api/files/${projectId}/content`, {
        path: selectedFile.path,
        content: fileContent,
        branch: currentBranch,
        message: `Update ${selectedFile.name}`
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsEditing(false);
      fetchFiles(); // Refresh file tree
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  const createNewFile = async () => {
    try {
      await axios.post(`/api/files/${projectId}/content`, {
        path: newFileName,
        content: newFileContent,
        branch: currentBranch,
        message: `Create ${newFileName}`
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewFileName('');
      setNewFileContent('');
      setShowUpload(false);
      fetchFiles();
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const deleteFile = async (filePath) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await axios.delete(`/api/files/${projectId}/content`, {
        data: {
          path: filePath,
          branch: currentBranch,
          message: `Delete ${filePath}`
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedFile(null);
      setFileContent('');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (items, level = 0) => {
    const filteredItems = searchTerm 
      ? items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : items;

    return filteredItems.map(item => (
      <div key={item.path} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div 
          className={`flex items-center py-1.5 px-2 hover:bg-gray-100 cursor-pointer rounded-md group transition-colors ${
            selectedFile?.path === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          onClick={() => {
            if (item.type === 'file') {
              fetchFileContent(item.path);
            } else {
              toggleFolder(item.path);
            }
          }}
        >
          {item.type === 'directory' ? (
            expandedFolders.has(item.path) ? (
              <FolderOpen className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
            )
          ) : (
            <File className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
          )}
          <span className="text-sm font-medium truncate flex-1">{item.name}</span>
          {item.type === 'file' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFile(item.path);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          )}
        </div>
        {item.type === 'directory' && expandedFolders.has(item.path) && item.children && (
          <div className="ml-2">
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const getLanguageFromPath = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      css: 'css',
      html: 'html',
      json: 'json',
      md: 'markdown',
      yml: 'yaml',
      yaml: 'yaml'
    };
    return languageMap[ext] || 'text';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* File Tree Sidebar */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              <GitBranch className="w-4 h-4 mr-2 text-gray-500" />
              Files
            </h3>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add file
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Go to file"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* File Tree */}
        <div className="p-2 max-h-96 overflow-y-auto">
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {renderFileTree(files)}
            </div>
          )}
        </div>
      </div>

      {/* File Content */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            {/* File Header */}
            <div className="border-b border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <File className="w-5 h-5 mr-3 text-gray-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedFile.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span>{selectedFile.size} bytes</span>
                      <span className="mx-2">•</span>
                      <span>{selectedFile.language}</span>
                      <span className="mx-2">•</span>
                      <span>Modified {new Date(selectedFile.lastModified || selectedFile.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isEditing 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {isEditing ? 'Editing' : 'Edit'}
                  </button>
                  {isEditing && (
                    <button
                      onClick={saveFileContent}
                      className="flex items-center px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save changes
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-hidden">
              {isEditing ? (
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm border-none resize-none focus:outline-none bg-white"
                  style={{ fontFamily: 'Monaco, Consolas, "Liberation Mono", Menlo, monospace' }}
                  placeholder="Enter file content..."
                />
              ) : (
                <div className="h-full overflow-auto bg-gray-50">
                  <pre className="p-4 font-mono text-sm leading-relaxed text-gray-800">
                    {fileContent || (
                      <span className="text-gray-500 italic">File is empty</span>
                    )}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No file selected</h3>
              <p className="text-gray-500">Choose a file from the sidebar to view its contents</p>
            </div>
          </div>
        )}
      </div>

      {/* New File Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create new file</h3>
              <p className="text-sm text-gray-500 mt-1">Add a new file to this repository</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File path
                </label>
                <input
                  type="text"
                  placeholder="e.g. src/components/NewFile.jsx"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File content
                </label>
                <textarea
                  placeholder="Enter file content..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                disabled={!newFileName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileBrowser; 