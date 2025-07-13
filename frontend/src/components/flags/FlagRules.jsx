// frontend/src/components/applications/FlagRules.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flag, Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
import { flagService } from '../../services/flagService';
import Loading from '../common/Loading';

const FlagRules = ({ appId, flagId, flagName }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: rules, isLoading, error } = useQuery({
    queryKey: ['flagRules', appId, flagId],
    queryFn: () => flagService.getFlagRules(appId, flagId),
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId) => flagService.deleteFlagRule(appId, flagId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries(['flagRules', appId, flagId]);
    },
    onError: (error) => {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule. Please try again.');
    },
  });

  const handleDelete = (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      deleteMutation.mutate(ruleId);
    }
  };

  const handleEdit = (ruleId) => {
    navigate(`/apps/${appId}/flags/${flagId}/rules/${ruleId}/edit`);
  };

  const formatConditions = (conditions) => {
    if (!conditions) return 'None';
    return Object.entries(conditions)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: [${value.join(', ')}]`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loading size="sm" text="Loading rules..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 text-sm">Failed to load rules</p>
      </div>
    );
  }

  const rulesData = rules?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Flag className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900">
          Rules for {flagName}
        </h3>
        <span className="text-sm text-gray-500">
          ({rulesData.length} rule{rulesData.length !== 1 ? 's' : ''})
        </span>
      </div>
      
      {rulesData.length === 0 ? (
        <div className="text-center py-8">
          <Flag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No rules found for this flag</p>
          <p className="text-gray-400 text-xs mt-1">Create a rule to get started</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rulesData.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <p className="truncate" title={rule.description}>
                          {rule.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {rule.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.type === 'toggle' 
                          ? 'bg-blue-100 text-blue-800' 
                          : rule.type === 'percentage' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {rule.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.target_percentage !== null ? (
                        <span className="font-medium">{rule.target_percentage}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <p className="truncate" title={formatConditions(rule.conditions)}>
                          {formatConditions(rule.conditions)}
                        </p>
                        {rule.hash_key && (
                          <p className="text-xs text-gray-500 mt-1">
                            Hash: {rule.hash_key}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {rule.enabled ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                        <span className={`ml-2 text-sm font-medium ${
                          rule.enabled ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {rule.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(rule.id)}
                        disabled={deleteMutation.isLoading}
                        className="inline-flex items-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit rule"
                      >
                      <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        disabled={deleteMutation.isLoading}
                        className="inline-flex items-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer with summary */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Total: {rulesData.length} rule{rulesData.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  {rulesData.filter(rule => rule.enabled).length} enabled
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                  {rulesData.filter(rule => !rule.enabled).length} disabled
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlagRules;