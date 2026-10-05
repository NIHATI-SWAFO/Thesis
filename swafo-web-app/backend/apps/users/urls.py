from django.urls import path
from .views import StudentSearchView, ProfileByEmailView, StudentListView, StudentProfileDetailView, UserListView, UserDetailView, CollegeListView, MockLoginView, NotificationListView, NotificationUpdateView

urlpatterns = [
    path('search/', StudentSearchView.as_view(), name='student-search'),
    path('profile-by-email/', ProfileByEmailView.as_view(), name='profile-by-email'),
    path('list/', StudentListView.as_view(), name='student-list'),
    path('list/<int:pk>/', StudentProfileDetailView.as_view(), name='student-profile-detail'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('colleges/', CollegeListView.as_view(), name='college-list'),
    path('mock-login/', MockLoginView.as_view(), name='mock-login'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/update/', NotificationUpdateView.as_view(), name='notification-update'),
]
