// frontend/src/pages/EditFlag.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { flagService } from '../services/flagService';
import ApplicationSelector from '../components/common/ApplicationSelector';
import Loading from '../components/common/Loading';

const EditFlag = () => {
  const navigate = useNavigate();
  const { app_id, flag_id } = useParams(); // Get both app_id and flag_id from URL

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    key: '',
    enabled: false,
    app_id: app_id || ''
  });

  const [customizeKey, setCustomizeKey] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch flag data using both app_id and flag_id
  const { data: flagResponse, isLoading, error } = useQuery({
    queryKey: ['flag', app_id, flag_id],
    queryFn: () => flagService.getFlag(app_id, flag_id),
    enabled: !!(app_id && flag_id),
  });

  // Extract flag data from response
  const flag = flagResponse?.data;

  // Initialize form data when flag is loaded
  useEffect(() => {
    console.log('Flag data received:', flag); // Debug log
    if (flag) {
      setFormData({
        name: flag.name || '',
        description: flag.description || '',
        key: flag.key || '',
        enabled: Boolean(flag.enabled), // Ensure boolean conversion
        app_id: flag.app_id || app_id || ''
      });
      console.log('Form data set to:', {
        name: flag.name || '',
        description: flag.description || '',
        key: flag.key || '',
        enabled: Boolean(flag.enabled),
        app_id: flag.app_id || app_id || ''
      }); // Debug log
    }
  }, [flag, app_id]);

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
    if (!customizeKey && formData.name && flag) {
      const generatedKey = generateKey(formData.name);
      // Only update if the key has changed from the original
      if (generatedKey !== flag.key) {
        setFormData(prev => ({
          ...prev,
          key: generatedKey
        }));
      }
    }
  }, [formData.name, customizeKey, flag]);

  // Update flag mutation
  const updateMutation = useMutation({
    mutationFn: (data) => flagService.updateFlag(data.app_id, flag_id, data),
    onSuccess: () => {
      toast.success('Flag updated successfully');
      // Navigate back to flags page with the specific app
      navigate(`/flags?app=${formData.app_id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update flag');
      // Handle validation errors
      if (error.details) {
        setErrors(error.details);
      }
    },
  });

  // Delete flag mutation
  const deleteMutation = useMutation({
    mutationFn: () => flagService.deleteFlag(app_id, flag_id),
    onSuccess: () => {
      toast.success('Flag deleted successfully');
      // Navigate back to flags page with the specific app
      navigate(`/flags?app=${formData.app_id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete flag');
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

  const handleApplicationSelect = (appId) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      app_id: appId
    }));

    // Update URL to reflect the new app selection
    if (appId !== app_id) {
      navigate(`/apps/${appId}/flags/${flag_id}/edit`, { replace: true });
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
    
    if (!checked && formData.name && flag) {
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

    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate(`/flags?app=${formData.app_id}`);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <X className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Error Loading Flag</h2>
          <p className="text-gray-600 mt-2">{error.message}</p>
        </div>
        <button
          onClick={() => navigate('/flags')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Flags
        </button>
      </div>
    );
  }

  if (!flag) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">
          <X className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Flag Not Found</h2>
          <p className="mt-2">The flag you're looking for doesn't exist.</p>
        </div>
        <button
          onClick={() => navigate('/flags')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Flags
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info - remove this in production */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-800">Debug Info:</h4>
        <pre className="text-xs text-yellow-700 mt-1">
          Flag data: {JSON.stringify(flag, null, 2)}
        </pre>
        <pre className="text-xs text-yellow-700 mt-1">
          Form data: {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Flag</h1>
            <p className="text-sm text-gray-500">Modify your feature flag settings</p>
          </div>
        </div>
        
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Flag
        </button>
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
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
                  disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending || !customizeKey}
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
              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
              Enable this flag
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {updateMutation.isPending ? (
                <Loading size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Flag
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete the flag "{flag.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                >
                  {deleteMutation.isPending ? (
                    <Loading size="sm" className="mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditFlag;