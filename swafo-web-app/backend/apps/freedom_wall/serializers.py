from rest_framework import serializers
from .models import FreedomWallSubmission, SubmissionResponse, SubmissionReferral, CommunityComment, CommunityReaction
from apps.users.serializers import UserSerializer

class SubmissionResponseSerializer(serializers.ModelSerializer):
    director_name = serializers.CharField(source='director.full_name', read_only=True)

    class Meta:
        model = SubmissionResponse
        fields = ['id', 'submission', 'director', 'director_name', 'content', 'is_internal_note', 'created_at']
        read_only_fields = ['director', 'created_at']

class SubmissionReferralSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = SubmissionReferral
        fields = ['id', 'submission', 'referred_to', 'reason', 'status', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']

class FreedomWallSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    responses = serializers.SerializerMethodField()
    referrals = SubmissionReferralSerializer(many=True, read_only=True)

    class Meta:
        model = FreedomWallSubmission
        fields = [
            'id', 'reference_number', 'student', 'student_name', 'is_anonymous',
            'submission_type', 'category', 'title', 'description', 'location',
            'student_reported_priority', 'official_priority', 'status', 'visibility', 'upvotes',
            'created_at', 'updated_at', 'resolved_at', 'resolution_file', 'responses', 'referrals'
        ]
        read_only_fields = ['reference_number', 'student', 'official_priority', 'status', 'visibility', 'upvotes', 'resolved_at']

    def get_student_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous Student"
        if obj.student:
            return obj.student.full_name
        return "Unknown"

    def get_responses(self, obj):
        request = self.context.get('request')
        responses = obj.responses.all()
        
        # If student is requesting, filter out internal notes
        if request and request.user.role == 'STUDENT':
            responses = responses.filter(is_internal_note=False)
            
        return SubmissionResponseSerializer(responses, many=True).data

class CommunityReactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = CommunityReaction
        fields = ['id', 'user_name', 'reaction_type', 'created_at']

class CommunityCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = CommunityComment
        fields = ['id', 'submission', 'author_name', 'is_anonymous', 'content', 'created_at', 'is_owner']
        read_only_fields = ['submission']

    def get_author_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous Student"
        return obj.author.full_name if obj.author else "Unknown"

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.author == request.user
        return False

class CommunityPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    comments = CommunityCommentSerializer(source='community_comments', many=True, read_only=True)
    reactions = CommunityReactionSerializer(source='community_reactions', many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = FreedomWallSubmission
        fields = [
            'id', 'author_name', 'is_anonymous', 'submission_type', 'category', 'title', 'description',
            'created_at', 'comment_count', 'comments', 'reactions', 'is_owner'
        ]
        
    def get_author_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous Student"
        if obj.student:
            return obj.student.full_name
        return "Student"
        
    def get_comment_count(self, obj):
        return obj.community_comments.count()

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.student == request.user
        return False

class FreedomWallSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FreedomWallSubmission
        fields = [
            'is_anonymous', 'submission_type', 'category', 'title', 'description', 
            'location', 'student_reported_priority'
        ]
