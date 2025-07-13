// frontend/src/pages/EditRule.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { flagService } from '../services/flagService';
import Loading from '../components/common/Loading';

const EditRule = () => {
  const navigate = useNavigate();
  const { app_id, flag_id, rule_id } = useParams();

  console.log('URL Params:', { app_id, flag_id, rule_id });

  const [formData, setFormData] = useState({
    description: '',
    type: 'toggle',
    priority: 1,
    target_percentage: '',
    enabled: true,
    app_id: app_id || '',
    flag_id: flag_id || ''
  });

  const [conditions, setConditions] = useState([
    { key: '', value: '' }
  ]);

  const [errors, setErrors] = useState({});

  // Fetch existing rule data
  const { data: rule, isLoading, error } = useQuery({
    queryKey: ['flag-rule', app_id, flag_id, rule_id],
    queryFn: () => flagService.getFlagRuleById(app_id, flag_id, rule_id),
    enabled: !!(app_id && flag_id && rule_id)
  });

  // Handle rule data population when data is loaded
  useEffect(() => {
    if (rule) {
      console.log('🔍 RAW API Response:', rule);
      console.log('🔍 Response type:', typeof rule);
      console.log('🔍 Response.data:', rule?.data);
      console.log('🔍 Response.data type:', typeof rule?.data);
      console.log('🔍 Response.data.length:', rule?.data?.length);
      
      // Extract the rule from the response - it's in an array
      const ruleData = rule?.data && rule.data.length > 0 ? rule.data[0] : null;
      
      console.log('🔍 Extracted ruleData:', ruleData);
      
      if (!ruleData) {
        console.error('❌ No rule data found in response');
        console.log('🔍 Available response keys:', Object.keys(rule || {}));
        toast.error('No rule data found');
        return;
      }
      
      console.log('🔍 Setting form data with:', {
        description: ruleData.description,
        type: ruleData.type,
        priority: ruleData.priority,
        target_percentage: ruleData.target_percentage,
        enabled: ruleData.enabled
      });
      
      // Populate form with existing rule data
      setFormData({
        description: ruleData.description || '',
        type: ruleData.type || 'toggle',
        priority: ruleData.priority || 1,
        target_percentage: ruleData.target_percentage || '',
        enabled: ruleData.enabled !== undefined ? ruleData.enabled : true,
        app_id: app_id || '',
        flag_id: flag_id || ''
      });

      // Populate conditions
      if (ruleData.conditions && typeof ruleData.conditions === 'object') {
        const conditionsArray = Object.entries(ruleData.conditions).map(([key, value]) => ({
          key,
          value: Array.isArray(value) ? value.join(', ') : value
        }));
        setConditions(conditionsArray.length > 0 ? conditionsArray : [{ key: '', value: '' }]);
      } else {
        console.log('🔍 No conditions found, setting empty condition');
        setConditions([{ key: '', value: '' }]);
      }
      
      console.log('✅ Form data populated successfully');
    }
  }, [rule, app_id, flag_id]);

  // Handle query error
  useEffect(() => {
    if (error) {
      console.error('❌ Query error:', error);
      toast.error('Failed to load rule data');
    }
  }, [error]);

  // Update rule mutation
  const updateMutation = useMutation({
    mutationFn: (data) => {
      console.log('Mutation received data:', data);
      
      // Extract app_id and flag_id, with fallbacks
      const appId = data.app_id || app_id;
      const flagId = data.flag_id || flag_id;
      
      console.log('Using IDs:', { appId, flagId, rule_id });
      
      if (!appId || !flagId || !rule_id) {
        throw new Error('Missing app_id, flag_id, or rule_id');
      }
      
      // Remove app_id and flag_id from the data before sending to API
      const { app_id: _, flag_id: __, ...ruleData } = data;
      
      console.log('Final rule data:', ruleData);
      
      return flagService.updateFlagRule(appId, flagId, rule_id, ruleData);
    },
    onSuccess: () => {
      toast.success('Rule updated successfully');
      navigate(`/flags?app=${formData.app_id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update rule');
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

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      type: newType,
      target_percentage: newType === 'conditional' ? 100 : prev.target_percentage
    }));

    // Reset conditions when changing type
    if (newType === 'toggle') {
      setConditions([{ key: '', value: '' }]);
    }
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const addCondition = () => {
    setConditions([...conditions, { key: '', value: '' }]);
  };

  const removeCondition = (index) => {
    if (formData.type === 'percentage' || index > 0) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  const buildConditionsObject = () => {
    const conditionsObj = {};
    conditions.forEach(condition => {
      if (condition.key && condition.value) {
        // Check if value contains commas (multiple values)
        if (condition.value.includes(',')) {
          conditionsObj[condition.key] = condition.value.split(',').map(v => v.trim());
        } else {
          conditionsObj[condition.key] = condition.value.trim();
        }
      }
    });
    return Object.keys(conditionsObj).length > 0 ? conditionsObj : null;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.priority || formData.priority < 1) {
      newErrors.priority = 'Priority must be a positive integer';
    }

    if (!formData.app_id) {
      newErrors.app_id = 'Application is required';
    }

    // Type specific validations
    if (formData.type === 'percentage' && (!formData.target_percentage || formData.target_percentage < 0 || formData.target_percentage > 100)) {
      newErrors.target_percentage = 'Target percentage must be between 0 and 100';
    }

    if (formData.type === 'conditional') {
      const hasValidConditions = conditions.some(c => c.key && c.value);
      if (!hasValidConditions) {
        newErrors.conditions = 'At least one condition is required for conditional type';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      description: formData.description,
      type: formData.type,
      priority: parseInt(formData.priority),
      enabled: formData.enabled,
    };

    // Add type-specific fields
    if (formData.type === 'percentage') {
      submitData.target_percentage = parseInt(formData.target_percentage);
      submitData.conditions = buildConditionsObject();
    } else if (formData.type === 'conditional') {
      submitData.conditions = buildConditionsObject();
      if (formData.target_percentage) {
        submitData.target_percentage = parseInt(formData.target_percentage);
      }
    }

    updateMutation.mutate(submitData);
  };

  const handleCancel = () => {
    navigate(`/flags?app=${formData.app_id}`);
  };

  const renderConditions = () => {
    if (formData.type === 'toggle') return null;

    const showConditions = formData.type === 'conditional' || formData.type === 'percentage';
    if (!showConditions) return null;

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Conditions {formData.type === 'conditional' ? '*' : '(Optional)'}
          </label>
          <button
            type="button"
            onClick={addCondition}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Condition
          </button>
        </div>
        
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div key={index} className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Key (e.g., role, region)"
                value={condition.key}
                onChange={(e) => handleConditionChange(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Value (e.g., admin or US,UK for multiple)"
                value={condition.value}
                onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500"
              />
              {(formData.type === 'percentage' || index > 0) && (
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {errors.conditions && (
          <p className="mt-1 text-sm text-red-600">{errors.conditions}</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Rule</h1>
            <p className="text-sm text-red-600">Failed to load rule data</p>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Rule</h1>
            <p className="text-sm text-gray-500">Update rule configuration for your feature flag</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={updateMutation.isPending}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="Describe what this rule controls..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Type Selection */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleTypeChange}
              disabled={updateMutation.isPending}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.type
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            >
              <option value="toggle">Toggle</option>
              <option value="percentage">Percentage</option>
              <option value="conditional">Conditional</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <input
              type="number"
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              disabled={updateMutation.isPending}
              min="1"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.priority
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="Enter priority (positive integer)..."
            />
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
            )}
          </div>

          {/* Target Percentage (for percentage and conditional types) */}
          {(formData.type === 'percentage' || formData.type === 'conditional') && (
            <div>
              <label htmlFor="target_percentage" className="block text-sm font-medium text-gray-700 mb-2">
                Target Percentage {formData.type === 'percentage' ? '*' : '(Optional)'}
              </label>
              <input
                type="number"
                id="target_percentage"
                name="target_percentage"
                value={formData.target_percentage}
                onChange={handleInputChange}
                disabled={updateMutation.isPending}
                min="0"
                max="100"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  errors.target_percentage
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                placeholder="Enter percentage (0-100)..."
              />
              {errors.target_percentage && (
                <p className="mt-1 text-sm text-red-600">{errors.target_percentage}</p>
              )}
            </div>
          )}

          {/* Conditions */}
          {renderConditions()}

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
              Enable this rule
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
              {updateMutation.isPending ? 'Updating...' : 'Update Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRule;