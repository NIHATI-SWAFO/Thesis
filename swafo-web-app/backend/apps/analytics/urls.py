from django.urls import path
from .views import OfficerDashboardAPIView, AdminDashboardAPIView

urlpatterns = [
    path('officer-dashboard/', OfficerDashboardAPIView.as_view(), name='officer-dashboard'),
    path('admin-dashboard/', AdminDashboardAPIView.as_view(), name='admin-dashboard'),
]
