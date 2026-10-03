from django.urls import path
from .views import (
    StudentSubmissionListCreateView,
    StudentSubmissionDetailView,
    DirectorSubmissionListView,
    DirectorSubmissionDetailView,
    DirectorSubmissionRespondView,
    DirectorSubmissionReferView,
    DirectorAnalyticsView,
    CommunityFeedView,
    CommunityPostDetailView,
    CommunityPostReactionView,
    CommunityPostCreateView,
    CommunityCommentCreateView,
    CommunityCommentDeleteView
)

urlpatterns = [
    # Student Endpoints
    path('submit/', StudentSubmissionListCreateView.as_view(), name='fw-submit'),
    path('my-submissions/', StudentSubmissionListCreateView.as_view(), name='fw-my-submissions'),
    path('my-submissions/<int:pk>/', StudentSubmissionDetailView.as_view(), name='fw-my-submission-detail'),
    path('community/', CommunityFeedView.as_view(), name='fw-community-feed'),
    path('community/post/', CommunityPostCreateView.as_view(), name='fw-community-post-create'),
    path('community/<int:pk>/', CommunityPostDetailView.as_view(), name='fw-community-detail'),
    path('community/<int:pk>/react/', CommunityPostReactionView.as_view(), name='fw-community-react'),
    path('community/<int:pk>/comment/', CommunityCommentCreateView.as_view(), name='fw-community-comment'),
    path('community/comment/<int:pk>/delete/', CommunityCommentDeleteView.as_view(), name='fw-community-comment-delete'),

    
    # Director Endpoints
    path('manage/', DirectorSubmissionListView.as_view(), name='fw-manage-list'),
    path('manage/<int:pk>/', DirectorSubmissionDetailView.as_view(), name='fw-manage-detail'),
    path('manage/<int:pk>/respond/', DirectorSubmissionRespondView.as_view(), name='fw-manage-respond'),
    path('manage/<int:pk>/refer/', DirectorSubmissionReferView.as_view(), name='fw-manage-refer'),
    path('analytics/', DirectorAnalyticsView.as_view(), name='fw-analytics'),
]
