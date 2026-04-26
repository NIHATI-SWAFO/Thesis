/**
 * SWAFO API Configuration
 * 
 * This file centralizes all API endpoints to ensure easy switching between
 * local development and production (Vercel/Railway).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  AUTH_MOCK_LOGIN: `${API_BASE_URL}/api/auth/mock-login/`,
  
  // Users
  SEARCH_USERS: `${API_BASE_URL}/api/users/search/`,
  USERS_LIST: `${API_BASE_URL}/api/users/list/`,
  USERS_BY_ROLE: (role) => `${API_BASE_URL}/api/users/users/?role=${role}`,
  PROFILE_BY_EMAIL: `${API_BASE_URL}/api/users/profile-by-email/`,
  
  // Violations
  VIOLATIONS_LIST: `${API_BASE_URL}/api/violations/list/`,
  VIOLATIONS_CREATE: `${API_BASE_URL}/api/violations/record/`,
  VIOLATIONS_ASSESS: `${API_BASE_URL}/api/violations/assess/`,
  VIOLATIONS_ASSIGN: (id) => `${API_BASE_URL}/api/violations/${id}/assign/`,
  VIOLATIONS_UPDATE_STATUS: (id) => `${API_BASE_URL}/api/violations/${id}/update-status/`,
  
  // Patrols
  PATROLS_LIST: `${API_BASE_URL}/api/patrols/list/`,
  PATROLS_CREATE: `${API_BASE_URL}/api/patrols/`,
  PATROLS_END: (id) => `${API_BASE_URL}/api/patrols/${id}/end_session/`,
  
  // Analytics
  OFFICER_DASHBOARD: `${API_BASE_URL}/api/analytics/officer-dashboard/`,
  ADMIN_DASHBOARD: `${API_BASE_URL}/api/analytics/admin-dashboard/`,
  
  // Handbook
  HANDBOOK_RULES: `${API_BASE_URL}/api/handbook/rules/`,
  SMART_SEARCH: `${API_BASE_URL}/api/handbook/smart-search/`,
};

export default API_BASE_URL;
