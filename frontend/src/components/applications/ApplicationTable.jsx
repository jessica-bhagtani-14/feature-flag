// frontend/src/components/applications/ApplicationTable.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  RefreshCw,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationService } from '../../services/applicationService';
import ApplicationStats from './ApplicationStats';

const ApplicationTable = ({ applications, onRefetch }) => {
  const navigate = useNavigate();
  const [visibleApiKeys, setVisibleApiKeys] = useState({});
  const [showStatsFor, setShowStatsFor] = useState(null);

  // Delete application mutation
  const deleteMutation = useMutation({
    mutationFn: applicationService.deleteApplication,
    onSuccess: () => {
      toast.success('Application deleted successfully');
      onRefetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete application');
    },
  });

  // Regenerate API key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: applicationService.regenerateApiKey,
    onSuccess: () => {
      toast.success('API key regenerated successfully');
      onRefetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to regenerate API key');
    },
  });

  const toggleApiKeyVisibility = (appId) => {
    setVisibleApiKeys(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

  const copyApiKey = async (apiKey) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success('API key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  const handleDelete = (app) => {
    if (window.confirm(`Are you sure you want to delete "${app.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(app.id);
    }
  };

  const handleRegenerateKey = (app) => {
    if (window.confirm(`Are you sure you want to regenerate the API key for "${app.name}"? The old key will stop working immediately.`)) {
      regenerateKeyMutation.mutate(app.id);
    }
  };

  const toggleStats = (appId) => {
    setShowStatsFor(showStatsFor === appId ? null : appId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskApiKey = (apiKey) => {
    if (!apiKey) return '';
    return `${apiKey.substring(0, 8)}${'.'.repeat(3)}${apiKey.substring(apiKey.length - 8)}`;
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.map((app) => (
              <React.Fragment key={app.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {app.name}
                      </div>
                      {app.description && (
                        <div className="text-sm text-gray-500">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-900">
                        {visibleApiKeys[app.id] ? app.api_key : maskApiKey(app.api_key)}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => toggleApiKeyVisibility(app.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title={visibleApiKeys[app.id] ? 'Hide API key' : 'Show API key'}
                        >
                          {visibleApiKeys[app.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyApiKey(app.api_key)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy API key"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(app.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(app.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleStats(app.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="View statistics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/applications/${app.id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit application"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRegenerateKey(app)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Regenerate API key"
                        disabled={regenerateKeyMutation.isPending}
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerateKeyMutation.isPending ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(app)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete application"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {showStatsFor === app.id && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 bg-gray-50">
                      <ApplicationStats appId={app.id} appName={app.name} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationTable;