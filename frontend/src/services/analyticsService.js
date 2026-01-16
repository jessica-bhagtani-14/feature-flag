import { apiClient } from "./api";

export const analyticsService = {
    async getDashboardOverview(){
        return apiClient.get('/analytics/dashboard/overview');
    },
    async getDashboardData(){
        return apiClient.get('/analytics/dashboard');
    },
    async getAppLevelAnalytics() {
        return apiClient.get('/analytics/apps');
    },
    async getFlagPerformanceByApp(appId){
        return apiClient.get(`/analytics/apps/${appId}/flags`);
    },
    async getEvaluationTimeSeries() {
        return apiClient.get('/analytics/timeseries');
    },
    async getPerformanceMetrics(){
        return apiClient.get('/analytics/performance');
    },
    async getRecentActivity(){
        return apiClient.get('/analytics/activity');
    },
    async exportAnalytics(){
        return apiClient.get('/analytics/export');
    },
    async getFlagAnalytics(flagId){
        return apiClient.get(`/analytics/flags/${flagId}`);
    },
    async getFlagStats(flagId){
        return apiClient.get(`/analytics/flags/${flagId}/stats`);
    }
}