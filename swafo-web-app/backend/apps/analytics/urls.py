from django.urls import path
from .views import OfficerDashboardAPIView

urlpatterns = [
    path('officer-dashboard/', OfficerDashboardAPIView.as_view(), name='officer-dashboard'),
]
