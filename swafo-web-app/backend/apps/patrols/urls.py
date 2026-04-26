from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatrolSessionViewSet

router = DefaultRouter()
router.register(r'', PatrolSessionViewSet)

urlpatterns = [
    path('list/', PatrolSessionViewSet.as_view({'get': 'list'})), # Keep backward compatibility
    path('', include(router.urls)),
]
