// frontend/src/services/authService.js
import { apiClient } from './api';

export const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token } = response.data;
      if (token) {
        apiClient.setToken(token);
        return response;
      }
      else
      throw new Error('No token received');
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local token
      console.warn('Logout request failed:', error);
    } finally {
      apiClient.setToken(null);
    }
  },

  async register(data) {
    try {
      await apiClient.post('/auth/register', data);
    } catch(error) {
      throw error;
    }
  },

  async updateProfile(profileData) {
    try{
      await apiClient.put('/auth/profile',profileData);
    } catch(error){
      throw error;
    }
  },

  async getProfile() {
    try{
      const response=await apiClient.get('/auth/profile');
      return response;
    } catch(error){
      throw error;
    }
  },

  async validateToken() {
    try {
      const response = await apiClient.get('/auth/validate');
      return response;
    } catch (error) {
      // If token validation fails, clear it
      apiClient.setToken(null);
      throw error;
    }
  },

  async changePassword(currentPassword, newPassword) {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  isAuthenticated() {
    return !!apiClient.token;
  },

  getToken() {
    return apiClient.token;
  },
};