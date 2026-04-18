from django.urls import path
from .views import ViolationAssessmentView, ViolationCreateView, ViolationListView

urlpatterns = [
    path('assess/', ViolationAssessmentView.as_view(), name='violation-assess'),
    path('record/', ViolationCreateView.as_view(), name='violation-record'),
    path('list/', ViolationListView.as_view(), name='violation-list'),
]
