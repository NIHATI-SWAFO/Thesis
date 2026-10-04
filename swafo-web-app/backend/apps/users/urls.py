from django.urls import path
from .views import StudentSearchView, ProfileByEmailView, StudentListView, UserListView, CollegeListView, MockLoginView, UpdateBarcodeView

urlpatterns = [
    path('search/', StudentSearchView.as_view(), name='student-search'),
    path('profile-by-email/', ProfileByEmailView.as_view(), name='profile-by-email'),
    path('update-barcode/', UpdateBarcodeView.as_view(), name='update-barcode'),
    path('list/', StudentListView.as_view(), name='student-list'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('colleges/', CollegeListView.as_view(), name='college-list'),
    path('mock-login/', MockLoginView.as_view(), name='mock-login'),
]
