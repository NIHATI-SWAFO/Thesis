from django.urls import path
from .views import StudentSearchView, ProfileByEmailView, StudentListView

urlpatterns = [
    path('search/', StudentSearchView.as_view(), name='student-search'),
    path('profile-by-email/', ProfileByEmailView.as_view(), name='profile-by-email'),
    path('list/', StudentListView.as_view(), name='student-list'),
]
