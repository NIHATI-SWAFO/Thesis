/**
 * SWAFO API Configuration
 * 
 * This file centralizes all API endpoints to ensure easy switching between
 * local development and production (Vercel/Railway).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
  // Auth
  AUTH_MOCK_LOGIN: `${API_BASE_URL}/api/auth/mock-login/`,
  
  // Users
  SEARCH_USERS: `${API_BASE_URL}/api/users/search/`,
  USERS_LIST: `${API_BASE_URL}/api/users/list/`,
  
  // Violations
  VIOLATIONS_LIST: `${API_BASE_URL}/api/violations/list/`,
  VIOLATIONS_CREATE: `${API_BASE_URL}/api/violations/record/`,
  VIOLATIONS_ASSESS: `${API_BASE_URL}/api/violations/assess/`,
  
  // Patrols
  PATROLS_LIST: `${API_BASE_URL}/api/patrols/list/`,
  
  // Analytics
  OFFICER_DASHBOARD: `${API_BASE_URL}/api/analytics/officer-dashboard/`,
  
  // Handbook
  HANDBOOK_RULES: `${API_BASE_URL}/api/handbook/rules/`,
  SMART_SEARCH: `${API_BASE_URL}/api/handbook/smart-search/`,
};

export default API_BASE_URL;
