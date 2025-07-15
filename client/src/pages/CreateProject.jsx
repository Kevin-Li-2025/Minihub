import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import { Plus, X, Eye, Code, AlertCircle, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CreateProject = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    readme: '# Project Title\n\n## Description\nDescribe your project here.\n\n## Features\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Installation\n```bash\nnpm install\n```\n\n## Usage\n```javascript\n// Your code example here\n```\n\n## Contributing\nContributions are welcome!',
    tags: [],
    language: 'JavaScript',
    isPublic: true
  });
  const [tagInput, setTagInput] = useState('');

  const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 
    'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    if (formData.readme.length > 10000) {
      newErrors.readme = 'README cannot exceed 10,000 characters';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await projectAPI.createProject(formData);
      
      if (result.success) {
        navigate(`/projects/${result.data.project._id}`, { 
          replace: true,
          state: { message: 'Project created successfully!' }
        });
      } else {
        setErrors({ general: result.error });
      }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600">
          Share your project with the community and collaborate with others
        </p>
      </div>

      {/* Error Alert */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter your project title"
                className={`input ${errors.title ? 'border-red-300 focus:ring-red-500' : ''}`}
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe your project"
                rows={3}
                className={`input resize-none ${errors.description ? 'border-red-300 focus:ring-red-500' : ''}`}
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Language
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="input"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (Optional)
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    className="input flex-1"
                    maxLength={20}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTagAdd(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    disabled={!tagInput.trim() || formData.tags.length >= 10}
                    className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="text-primary-500 hover:text-primary-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  {formData.tags.length}/10 tags • Press Enter or click + to add
                </p>
              </div>
            </div>

            {/* Privacy */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Make this project public
                </span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Public projects can be viewed by anyone. Private projects are only visible to you and collaborators.
              </p>
            </div>
          </div>
        </div>

        {/* README Editor */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">README</h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  !showPreview 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="h-4 w-4 inline mr-1" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  showPreview 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                Preview
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="markdown-content border border-gray-200 rounded-lg p-4 min-h-96 bg-gray-50">
              <ReactMarkdown>{formData.readme}</ReactMarkdown>
            </div>
          ) : (
            <div>
              <textarea
                name="readme"
                value={formData.readme}
                onChange={handleChange}
                placeholder="Write your project documentation in Markdown..."
                rows={20}
                className={`input resize-none font-mono text-sm ${errors.readme ? 'border-red-300 focus:ring-red-500' : ''}`}
                maxLength={10000}
              />
              {errors.readme && (
                <p className="mt-1 text-sm text-red-600">{errors.readme}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.readme.length}/10,000 characters • Supports Markdown formatting
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Create Project</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProject; 