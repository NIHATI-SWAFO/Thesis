from django.urls import path
from .views import OfficerDashboardAPIView, AdminDashboardAPIView, CollegeReportPDFView, NotificationsAPIView

urlpatterns = [
    path('officer-dashboard/', OfficerDashboardAPIView.as_view(), name='officer-dashboard'),
    path('admin-dashboard/', AdminDashboardAPIView.as_view(), name='admin-dashboard'),
    path('college-report/', CollegeReportPDFView.as_view(), name='college-report'),
    path('notifications/', NotificationsAPIView.as_view(), name='notifications'),
]

