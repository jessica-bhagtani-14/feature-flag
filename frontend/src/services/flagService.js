// frontend/src/services/flagService.js
import { apiClient } from './api';

export const flagService = {
  // Get all flags for an application
  async getFlags(appId, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString();
    const endpoint = `/${appId}/flags${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(endpoint);
  },

  // Get a specific flag
  async getFlag(appId, flagId) {
    return apiClient.get(`/${appId}/flags/${flagId}`);
  },

  // Create a new flag
  async createFlag(appId, flagData) {
    return apiClient.post(`/${appId}/flags`, flagData);
  },

  // Update a flag
  async updateFlag(appId, flagId, flagData) {
    return apiClient.put(`/${appId}/flags/${flagId}`, flagData);
  },

  // Toggle a flag (enable/disable)
  async toggleFlag(appId, flagId) {
    return apiClient.post(`/${appId}/flags/${flagId}/toggle`);
  },

  // Delete a flag
  async deleteFlag(appId, flagId) {
    return apiClient.delete(`/${appId}/flags/${flagId}`);
  },

  // Bulk update flags
  async bulkUpdateFlags(appId, updates) {
    return apiClient.post(`/${appId}/flags/bulk-update`, { updates });
  },

  // Get flag statistics
  async getFlagStats(appId) {
    return apiClient.get(`/${appId}/flags/stats`);
  },

  // Flag Rules
  async getFlagRules(appId, flagId) {
    return apiClient.get(`/${appId}/flags/${flagId}/rules`);
  },

  async getFlagRuleById(appId, flagId, ruleId) {
    return apiClient.get(`/${appId}/flags/${flagId}/rules/${ruleId}`);
  },

  async createFlagRule(appId, flagId, ruleData) {
    console.log(appId);
    console.log(flagId);
    return apiClient.post(`/${appId}/flags/${flagId}/rules`, ruleData);
  },

  async updateFlagRule(appId, flagId, ruleId, ruleData) {
    return apiClient.put(`/${appId}/flags/${flagId}/rules/${ruleId}`, ruleData);
  },

  async deleteFlagRule(appId, flagId, ruleId) {
    return apiClient.delete(`/${appId}/flags/${flagId}/rules/${ruleId}`);
  },
};