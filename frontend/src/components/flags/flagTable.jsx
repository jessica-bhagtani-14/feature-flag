// frontend/src/components/flags/FlagTable.jsx
import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  Edit, 
  Trash2,
  Power,
  Clock,
  List,
  ListPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { flagService } from '../../services/flagService';
import FlagRules from './FlagRules';

const FlagTable = ({ flags, onRefetch, selectedAppId }) => {
  const navigate = useNavigate();
  const [showRulesFor, setShowRulesFor] = useState(null);

  // Delete flag mutation
  const deleteMutation = useMutation({
    mutationFn: ({ appId, flagId }) => flagService.deleteFlag(appId, flagId),
    onSuccess: () => {
      toast.success('Flag deleted successfully');
      onRefetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete flag');
    },
  });

  // Toggle flag mutation
  const toggleMutation = useMutation({
    mutationFn: ({ appId, flagId }) => flagService.toggleFlag(appId, flagId),
    onSuccess: () => {
      toast.success('Flag status updated');
      onRefetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to toggle flag');
    },
  });

  const handleDelete = (flag) => {
    if (window.confirm(`Are you sure you want to delete "${flag.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ appId: selectedAppId, flagId: flag.id });
    }
  };

  const handleToggle = (flag) => {
    toggleMutation.mutate({ appId: selectedAppId, flagId: flag.id });
  };

  const handleEdit = (flag) => {
    navigate(`/apps/${selectedAppId}/flags/${flag.id}/edit`);
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

  const getStatusBadge = (enabled) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        enabled 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          enabled ? 'bg-green-400' : 'bg-gray-400'
        }`} />
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    );
  };

  const toggleRules = (flagId) => {
    setShowRulesFor(showRulesFor === flagId ? null : flagId);
  };

  const addRule = (flagId) => {
    navigate(`/apps/${selectedAppId}/flags/${flagId}/new`);
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flag
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {flags.map((flag) => (
              <React.Fragment key={flag.id}>
              <tr key={flag.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {flag.name}
                    </div>
                    {flag.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {flag.description}
                      </div>
                    )}
                  </div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-500">
                    <Key className="h-4 w-4 mr-1.5" />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {flag.key}
                    </code>
                  </div>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(flag.enabled)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {formatDate(flag.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {formatDate(flag.updated_at)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => toggleRules(flag.id)}
                      className="text-purple-600 hover:text-purple-900"
                      title="View rules"
                      >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => addRule(flag.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Add rule"
                      >
                      <ListPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(flag)}
                      className={`p-1 rounded ${
                        flag.enabled 
                          ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      title={flag.enabled ? 'Disable flag' : 'Enable flag'}
                      disabled={toggleMutation.isPending}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(flag)}
                      className="p-1 rounded text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                      title="Edit flag"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(flag)}
                      className="p-1 rounded text-red-600 hover:text-red-900 hover:bg-red-50"
                      title="Delete flag"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {showRulesFor === flag.id && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 bg-gray-50">
                    <FlagRules appId={flag.app_id} flagId={flag.id} flagName={flag.name}/>
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

export default FlagTable;