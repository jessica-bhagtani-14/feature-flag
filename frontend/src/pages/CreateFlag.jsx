// frontend/src/pages/CreateFlag.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { flagService } from '../services/flagService';
import ApplicationSelector from '../components/common/ApplicationSelector';
import Loading from '../components/common/Loading';

const CreateFlag = () => {
  const navigate = useNavigate();
  const { app_id } = useParams(); // Get app_id from URL params

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    key: '',
    enabled: false,
    app_id: app_id || '' // Initialize with app_id from URL
  });

  const [customizeKey, setCustomizeKey] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-generate key from name
  const generateKey = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  };

  // Update key when name changes (if not customizing)
  useEffect(() => {
    if (!customizeKey && formData.name) {
      setFormData(prev => ({
        ...prev,
        key: generateKey(formData.name)
      }));
    }
  }, [formData.name, customizeKey]);

  // Create flag mutation
  const createMutation = useMutation({
    mutationFn: (data) => flagService.createFlag(data.app_id, data),
    onSuccess: () => {
      toast.success('Flag created successfully');
      // Navigate back to flags page with the specific app
      navigate(`/flags?app=${formData.app_id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create flag');
      // Handle validation errors
      if (error.details) {
        setErrors(error.details);
      }
    },
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleApplicationSelect = (app) => {
    // Extract the app ID from the app object
    const appId = app ? app.id : null;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      app_id: appId
    }));

    // Update URL to reflect the new app selection
    if (appId && appId !== app_id) {
      navigate(`/apps/${appId}/flags/new`, { replace: true });
    }

    // Clear app_id error
    if (errors.app_id) {
      setErrors(prev => ({
        ...prev,
        app_id: undefined
      }));
    }
  };

  const handleCustomizeKeyChange = (e) => {
    const checked = e.target.checked;
    setCustomizeKey(checked);
    
    if (!checked && formData.name) {
      // Reset key to auto-generated version
      setFormData(prev => ({
        ...prev,
        key: generateKey(formData.name)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.key.trim()) {
      newErrors.key = 'Key is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.key)) {
      newErrors.key = 'Key can only contain lowercase letters, numbers, and underscores';
    }

    if (!formData.app_id) {
      newErrors.app_id = 'Application is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createMutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate(`/flags?app=${formData.app_id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Flag</h1>
            <p className="text-sm text-gray-500">Add a new feature flag to your application</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Application Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application *
            </label>
            <ApplicationSelector
              selectedAppId={formData.app_id}
              onApplicationSelect={handleApplicationSelect}
              placeholder="Select an application..."
              disabled={createMutation.isPending}
            />
            {errors.app_id && (
              <p className="mt-1 text-sm text-red-600">{errors.app_id}</p>
            )}
          </div>

          {/* Flag Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={createMutation.isPending}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="Enter flag name..."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Flag Key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                Key *
              </label>
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={customizeKey}
                  onChange={handleCustomizeKeyChange}
                  disabled={createMutation.isPending}
                  className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Customize key
              </label>
            </div>
            <input
              type="text"
              id="key"
              name="key"
              value={formData.key}
              onChange={handleInputChange}
              disabled={createMutation.isPending || !customizeKey}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                !customizeKey
                  ? 'bg-gray-50 text-gray-500'
                  : errors.key
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="Auto-generated from name..."
            />
            {errors.key && (
              <p className="mt-1 text-sm text-red-600">{errors.key}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Key will be auto-generated from the name. Check "Customize key" to edit manually.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={createMutation.isPending}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Describe what this flag controls..."
            />
          </div>

          {/* Enabled Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={formData.enabled}
              onChange={handleInputChange}
              disabled={createMutation.isPending}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
              Enable this flag immediately
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {createMutation.isPending ? (
                <Loading size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {createMutation.isPending ? 'Creating...' : 'Create Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFlag;