// frontend/src/pages/EditApplication.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationService } from '../services/applicationService';
import Loading from '../components/common/Loading';

const EditApplication = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch application data
  const { data: application, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getApplication(id),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ appId, appData }) => applicationService.updateApplication(appId, appData),
    onSuccess: () => {
      toast.success('Application updated successfully');
      navigate('/applications');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update application');
      if (error.data?.errors) {
        setErrors(error.data.errors);
      }
    },
  });

  // Regenerate API key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: applicationService.regenerateApiKey,
    onSuccess: () => {
      toast.success('API key regenerated successfully');
      // Refetch application data to get new API key
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to regenerate API key');
    },
  });

  // Set form data when application loads
  useEffect(() => {
    if (application?.data) {
      setFormData({
        name: application.data.name || '',
        description: application.data.description || ''
      });
    }
  }, [application]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Application name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateMutation.mutate({ appId: id, appData: formData });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const copyApiKey = async (apiKey) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const handleRegenerateKey = () => {
    if (window.confirm('Are you sure you want to regenerate the API key? The old key will stop working immediately.')) {
      regenerateKeyMutation.mutate(id);
    }
  };

  const maskApiKey = (apiKey) => {
    if (!apiKey) return '';
    return `${apiKey.substring(0, 8)}${'*'.repeat(48)}${apiKey.substring(apiKey.length - 8)}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" text="Loading application..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-medium">Error loading application</p>
          <p className="text-sm">{error.message}</p>
        </div>
        <button
          onClick={() => navigate('/applications')}
          className="btn btn-primary"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  const app = application?.data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/applications')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Applications
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Application</h1>
        <p className="text-gray-600 mt-1">
          Update your application details and manage API key
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Application Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="Enter application name"
              disabled={updateMutation.isPending}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.description
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="Enter application description (optional)"
              disabled={updateMutation.isPending}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/applications')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* API Key Management Section */}
      <div className="card">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">API Key Management</h3>
            <p className="text-sm text-gray-600">
              Use this API key to authenticate requests to the feature flag API
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={showApiKey ? app?.api_key : maskApiKey(app?.api_key)}
                  readOnly
                  className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
                title={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => copyApiKey(app?.api_key)}
                className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
                title="Copy API key"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Regenerate API Key
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Regenerating the API key will immediately invalidate the current key. 
                    Make sure to update any applications using the old key.
                  </p>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleRegenerateKey}
                    disabled={regenerateKeyMutation.isPending}
                    className="px-3 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {regenerateKeyMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-800 border-t-transparent"></div>
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Regenerate API Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Info */}
      <div className="card">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Application Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(app?.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(app?.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditApplication;