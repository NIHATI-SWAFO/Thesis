from django.urls import path
from .views import PatrolSessionListView

urlpatterns = [
    path('list/', PatrolSessionListView.as_view(), name='patrol-list'),
]
