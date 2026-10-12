/**
 * SWAFO API Configuration
 * 
 * This file centralizes all API endpoints to ensure easy switching between
 * local development and production (Vercel/Railway).
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://thesis-production-1816.up.railway.app';

export const API_ENDPOINTS = {
  // Auth & Credential Recovery
  AUTH_MOCK_LOGIN: `${API_BASE_URL}/api/users/mock-login/`,
  PRESENCE_HEARTBEAT: `${API_BASE_URL}/api/users/presence/heartbeat/`,
  PRESENCE_OFFLINE: `${API_BASE_URL}/api/users/presence/offline/`,
  DIRECTOR_FORGOT_PASSWORD: `${API_BASE_URL}/api/users/auth/director/forgot-password/`,
  DIRECTOR_RESET_PASSWORD: `${API_BASE_URL}/api/users/auth/director/reset-password/`,
  OFFICER_REQUEST_RESET: `${API_BASE_URL}/api/users/auth/officer/request-reset/`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/users/auth/change-password/`,
  ADMIN_OFFICERS: `${API_BASE_URL}/api/users/admin/officers/`,
  ADMIN_OFFICER_CREATE: `${API_BASE_URL}/api/users/admin/officers/create/`,
  ADMIN_OFFICER_DELETE: (id) => `${API_BASE_URL}/api/users/admin/officers/${id}/delete/`,
  ADMIN_OFFICER_TOGGLE_STATUS: (id) => `${API_BASE_URL}/api/users/admin/officers/${id}/toggle-status/`,
  ADMIN_OFFICER_MANUAL_RESET: (id) => `${API_BASE_URL}/api/users/admin/officers/${id}/manual-reset/`,
  ADMIN_RESET_REQUESTS: `${API_BASE_URL}/api/users/admin/reset-requests/`,
  ADMIN_RESET_REQUEST_APPROVE: (id) => `${API_BASE_URL}/api/users/admin/reset-requests/${id}/approve/`,
  ADMIN_RESET_REQUEST_REJECT: (id) => `${API_BASE_URL}/api/users/admin/reset-requests/${id}/reject/`,
  ADMIN_SECURITY_AUDIT_LOGS: `${API_BASE_URL}/api/users/admin/security-audit-logs/`,
  
  // Users
  SEARCH_USERS: `${API_BASE_URL}/api/users/search/`,
  USERS_LIST: `${API_BASE_URL}/api/users/list/`,
  USERS_ALL: `${API_BASE_URL}/api/users/users/`,
  USER_DETAIL: (id) => `${API_BASE_URL}/api/users/users/${id}/`,
  USERS_BY_ROLE: (role) => `${API_BASE_URL}/api/users/users/?role=${role}`,
  PROFILE_BY_EMAIL: `${API_BASE_URL}/api/users/profile-by-email/`,
  UPDATE_STUDENT_NUMBER: `${API_BASE_URL}/api/users/update-student-number/`,
  UPDATE_PROFILE_PICTURE: `${API_BASE_URL}/api/users/profile/update-picture/`,
  COLLEGES_LIST: `${API_BASE_URL}/api/users/colleges/`,
  UPDATE_BARCODE: `${API_BASE_URL}/api/users/update-barcode/`,
  DECODE_BARCODE: `${API_BASE_URL}/api/users/decode-barcode/`,


  
    NOTIFICATIONS: `${API_BASE_URL}/api/users/notifications/`,
  NOTIFICATIONS_UPDATE: (id) => `${API_BASE_URL}/api/users/notifications/${id}/update/`,

  // Violations
  VIOLATIONS_LIST: `${API_BASE_URL}/api/violations/list/`,
  VIOLATIONS_CREATE: `${API_BASE_URL}/api/violations/record/`,
  VIOLATIONS_ASSESS: `${API_BASE_URL}/api/violations/assess/`,
  VIOLATIONS_ASSIGN: (id) => `${API_BASE_URL}/api/violations/${id}/assign/`,
  VIOLATIONS_UPDATE_STATUS: (id) => `${API_BASE_URL}/api/violations/${id}/update-status/`,
  VIOLATIONS_HEATMAP: `${API_BASE_URL}/api/violations/heatmap/`,
  VIOLATIONS_LOCATIONS: `${API_BASE_URL}/api/violations/locations/`,
  VIOLATIONS_STATISTICS: `${API_BASE_URL}/api/violations/statistics/`,
  VIOLATIONS_APPEALS: `${API_BASE_URL}/api/violations/appeals/`,
  VIOLATIONS_APPEALS_SUBMIT: `${API_BASE_URL}/api/violations/appeals/submit/`,
  VIOLATIONS_APPEALS_UPDATE: (id) => `${API_BASE_URL}/api/violations/appeals/${id}/update/`,
  
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
  NOTIFICATIONS: (email = '', role = '') => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (role) params.append('role', role);
    const q = params.toString();
    return `${API_BASE_URL}/api/analytics/notifications/${q ? `?${q}` : ''}`;
  },
  
  // Handbook
  HANDBOOK_RULES: `${API_BASE_URL}/api/handbook/rules/`,
  SMART_SEARCH: `${API_BASE_URL}/api/handbook/smart-search/`,
  AI_CHAT: `${API_BASE_URL}/api/ai/chat/`,

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




