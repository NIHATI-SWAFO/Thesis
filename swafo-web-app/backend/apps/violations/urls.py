from django.urls import path
from .views import (
    ViolationAssessmentView, ViolationCreateView, ViolationListView,
    ViolationUpdateStatusView, ViolationAssignView,
    HeatmapView, LocationsView,
)

urlpatterns = [
    path('assess/',              ViolationAssessmentView.as_view(),  name='violation-assess'),
    path('record/',              ViolationCreateView.as_view(),      name='violation-record'),
    path('list/',                ViolationListView.as_view(),        name='violation-list'),
    path('<int:id>/update-status/', ViolationUpdateStatusView.as_view(), name='violation-update-status'),
    path('<int:id>/assign/',     ViolationAssignView.as_view(),      name='violation-assign'),
    path('heatmap/',             HeatmapView.as_view(),              name='violation-heatmap'),
    path('locations/',           LocationsView.as_view(),            name='violation-locations'),
]
