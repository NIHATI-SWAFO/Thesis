from django.urls import path
from .views import HandbookListView, HandbookSmartSearchView

urlpatterns = [
    path('rules/', HandbookListView.as_view(), name='handbook-rules'),
    path('smart-search/', HandbookSmartSearchView.as_view(), name='handbook-smart-search'),
]
