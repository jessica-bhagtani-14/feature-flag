// frontend/src/services/applicationService.js
import { apiClient } from './api';

export const applicationService = {
  // Get all applications
  async getApplications() {
    return apiClient.get('/applications');
  },

  // Get a specific application
  async getApplication(appId) {
    return apiClient.get(`/applications/${appId}`);
  },

  // Create a new application
  async createApplication(appData) {
    return apiClient.post('/applications', appData);
  },

  // Update an application
  async updateApplication(appId, appData) {
    return apiClient.put(`/applications/${appId}`, appData);
  },

  // Delete an application
  async deleteApplication(appId) {
    return apiClient.delete(`/applications/${appId}`);
  },

  // Regenerate API key for an application
  async regenerateApiKey(appId) {
    return apiClient.post(`/applications/${appId}/regenerate-key`);
  },

  // Get application statistics
  async getApplicationStats(appId) {
    return apiClient.get(`/applications/${appId}/stats`);
  },

  async getStats(userId) {
    return apiClient.get(`/applications/stats`);
  }
};