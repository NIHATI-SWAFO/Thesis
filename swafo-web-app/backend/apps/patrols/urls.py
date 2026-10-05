from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatrolSessionViewSet, PatrolAssignmentViewSet, PatrolZoneMappingViewSet

router = DefaultRouter()
router.register(r'assignments', PatrolAssignmentViewSet, basename='patrol-assignment')
router.register(r'zone-mappings', PatrolZoneMappingViewSet, basename='zone-mapping')
router.register(r'', PatrolSessionViewSet, basename='patrol')

urlpatterns = [
    path('list/', PatrolSessionViewSet.as_view({'get': 'list'})), # Keep backward compatibility
    path('', include(router.urls)),
]


