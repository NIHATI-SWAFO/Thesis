/**
 * SWAFO API Configuration
 * 
 * This file centralizes all API endpoints to ensure easy switching between
 * local development and production (Vercel/Railway).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://thesis-production-1816.up.railway.app';

export const API_ENDPOINTS = {
  // Auth
  AUTH_MOCK_LOGIN: `${API_BASE_URL}/api/users/mock-login/`,
  
  // Users
  SEARCH_USERS: `${API_BASE_URL}/api/users/search/`,
  USERS_LIST: `${API_BASE_URL}/api/users/list/`,
  USERS_BY_ROLE: (role) => `${API_BASE_URL}/api/users/users/?role=${role}`,
  PROFILE_BY_EMAIL: `${API_BASE_URL}/api/users/profile-by-email/`,
  COLLEGES_LIST: `${API_BASE_URL}/api/users/colleges/`,

  
  // Violations
  VIOLATIONS_LIST: `${API_BASE_URL}/api/violations/list/`,
  VIOLATIONS_CREATE: `${API_BASE_URL}/api/violations/record/`,
  VIOLATIONS_ASSESS: `${API_BASE_URL}/api/violations/assess/`,
  VIOLATIONS_ASSIGN: (id) => `${API_BASE_URL}/api/violations/${id}/assign/`,
  VIOLATIONS_UPDATE_STATUS: (id) => `${API_BASE_URL}/api/violations/${id}/update-status/`,
  VIOLATIONS_HEATMAP: `${API_BASE_URL}/api/violations/heatmap/`,
  VIOLATIONS_LOCATIONS: `${API_BASE_URL}/api/violations/locations/`,
  VIOLATIONS_STATISTICS: `${API_BASE_URL}/api/violations/statistics/`,
  
  // Patrols
  PATROLS_LIST: `${API_BASE_URL}/api/patrols/list/`,
  PATROLS_CREATE: `${API_BASE_URL}/api/patrols/`,
  PATROLS_HISTORY: `${API_BASE_URL}/api/patrols/list/`,
  PATROLS_STATISTICS: `${API_BASE_URL}/api/patrols/statistics/`,
  PATROLS_END: (id) => `${API_BASE_URL}/api/patrols/${id}/end_session/`,
  PATROLS_PATROLLED_TODAY: `${API_BASE_URL}/api/patrols/patrolled_today/`,
  PATROLS_ASSIGNMENTS_CURRENT: `${API_BASE_URL}/api/patrols/assignments/current/`,
  PATROLS_ASSIGNMENTS_MY: `${API_BASE_URL}/api/patrols/assignments/my_assignment/`,
  PATROLS_ZONE_MAPPINGS: `${API_BASE_URL}/api/patrols/zone-mappings/`,

  
  // Analytics
  OFFICER_DASHBOARD: `${API_BASE_URL}/api/analytics/officer-dashboard/`,
  ADMIN_DASHBOARD: `${API_BASE_URL}/api/analytics/admin-dashboard/`,
  COLLEGE_REPORT: (college) => `${API_BASE_URL}/api/analytics/college-report/?college=${encodeURIComponent(college)}`,
  
  // Handbook
  HANDBOOK_RULES: `${API_BASE_URL}/api/handbook/rules/`,
  SMART_SEARCH: `${API_BASE_URL}/api/handbook/smart-search/`,

  // Freedom Wall Endpoints
  FW_STUDENT_SUBMIT: `${API_BASE_URL}/api/freedom-wall/submit/`,
  FW_MY_SUBMISSIONS: `${API_BASE_URL}/api/freedom-wall/my-submissions/`,
  FW_MANAGE_LIST: `${API_BASE_URL}/api/freedom-wall/manage/`,
  FW_MANAGE_DETAIL: (id) => `${API_BASE_URL}/api/freedom-wall/manage/${id}/`,
  FW_MANAGE_RESPOND: (id) => `${API_BASE_URL}/api/freedom-wall/manage/${id}/respond/`,
  FW_MANAGE_REFER: (id) => `${API_BASE_URL}/api/freedom-wall/manage/${id}/refer/`,
  FW_ANALYTICS: `${API_BASE_URL}/api/freedom-wall/analytics/`,
  FW_COMMUNITY: `${API_BASE_URL}/api/freedom-wall/community/`,
  FW_COMMUNITY_DETAIL: (id) => `${API_BASE_URL}/api/freedom-wall/community/${id}/`,
  FW_COMMUNITY_REACT: (id) => `${API_BASE_URL}/api/freedom-wall/community/${id}/react/`,
  FW_COMMUNITY_COMMENT: (id) => `${API_BASE_URL}/api/freedom-wall/community/${id}/comment/`,
  FW_COMMUNITY_COMMENT_DELETE: (id) => `${API_BASE_URL}/api/freedom-wall/community/comment/${id}/delete/`,
  FW_COMMUNITY_CREATE: `${API_BASE_URL}/api/freedom-wall/community/post/`,
};

export default API_BASE_URL;
