from django.urls import path
from .views import (
    StudentSearchView, ProfileByEmailView, StudentListView, StudentProfileDetailView,
    UserListView, UserDetailView, CollegeListView, MockLoginView,
    UpdateBarcodeView, DecodeBarcodeImageView, UpdateStudentNumberView,
    NotificationListView, NotificationUpdateView, UpdateProfilePictureView,
    DirectorForgotPasswordView, DirectorResetPasswordView,
    OfficerRequestResetView, OfficerAccountsListView, OfficerToggleStatusView,
    OfficerDeleteView, OfficerCreateView, OfficerManualResetPasswordView, OfficerResetRequestsListView,
    OfficerApproveResetRequestView, OfficerRejectResetRequestView,
    SecurityAuditLogsListView, OfficerChangePasswordView,
    PresenceHeartbeatView, PresenceOfflineView
)

urlpatterns = [
    path('search/', StudentSearchView.as_view(), name='student-search'),
    path('profile-by-email/', ProfileByEmailView.as_view(), name='profile-by-email'),
    path('update-student-number/', UpdateStudentNumberView.as_view(), name='update-student-number'),
    path('update-barcode/', UpdateBarcodeView.as_view(), name='update-barcode'),
    path('decode-barcode/', DecodeBarcodeImageView.as_view(), name='decode-barcode'),
    path('profile/update-picture/', UpdateProfilePictureView.as_view(), name='update-profile-picture'),
    path('profile/picture/', UpdateProfilePictureView.as_view(), name='profile-picture-alias'),
    path('list/', StudentListView.as_view(), name='student-list'),
    path('list/<int:pk>/', StudentProfileDetailView.as_view(), name='student-profile-detail'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('colleges/', CollegeListView.as_view(), name='college-list'),
    path('mock-login/', MockLoginView.as_view(), name='mock-login'),
    path('presence/heartbeat/', PresenceHeartbeatView.as_view(), name='presence-heartbeat'),
    path('presence/offline/', PresenceOfflineView.as_view(), name='presence-offline'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/update/', NotificationUpdateView.as_view(), name='notification-update'),

    # Credential Recovery & Password Management
    path('auth/director/forgot-password/', DirectorForgotPasswordView.as_view(), name='director-forgot-password'),
    path('auth/director/reset-password/', DirectorResetPasswordView.as_view(), name='director-reset-password'),
    path('auth/officer/request-reset/', OfficerRequestResetView.as_view(), name='officer-request-reset'),
    path('auth/change-password/', OfficerChangePasswordView.as_view(), name='officer-change-password'),

    # Director Officer Management & Security
    path('admin/officers/', OfficerAccountsListView.as_view(), name='admin-officers-list'),
    path('admin/officers/create/', OfficerCreateView.as_view(), name='admin-officers-create'),
    path('admin/officers/<int:pk>/delete/', OfficerDeleteView.as_view(), name='admin-officers-delete'),
    path('admin/officers/<int:pk>/toggle-status/', OfficerToggleStatusView.as_view(), name='admin-officers-toggle-status'),
    path('admin/officers/<int:pk>/manual-reset/', OfficerManualResetPasswordView.as_view(), name='admin-officers-manual-reset'),
    path('admin/reset-requests/', OfficerResetRequestsListView.as_view(), name='admin-reset-requests-list'),
    path('admin/reset-requests/<int:pk>/approve/', OfficerApproveResetRequestView.as_view(), name='admin-reset-requests-approve'),
    path('admin/reset-requests/<int:pk>/reject/', OfficerRejectResetRequestView.as_view(), name='admin-reset-requests-reject'),
    path('admin/security-audit-logs/', SecurityAuditLogsListView.as_view(), name='admin-security-audit-logs'),
]

