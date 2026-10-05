from django.db import models
from django.conf import settings
from apps.users.models import StudentProfile

class FreedomWallSubmission(models.Model):
    TYPE_CHOICES = [
        ('report_something', 'Report Something'),
        ('get_help', 'Get Help'),
        ('resolve_conflict', 'Resolve a Conflict'),
        ('suggest_improvement', 'Suggest an Improvement'),
        ('share_experience', 'Share Your Experience'),
        ('give_appreciation', 'Give Appreciation'),
    ]

    CATEGORY_CHOICES = [
        ('General Feedback', 'General Feedback'),
        ('School Concern', 'School Concern'),
        ('Officer Report', 'Officer Report'),
        ('Professor', 'Professor / Faculty'),
        ('Subject', 'Subject / Curriculum'),
        ('Administration', 'School Administration'),
        ('Student Services', 'Student Services'),
        ('Facilities', 'Facilities'),
        ('Bullying', 'Bullying / Harassment'),
        ('Safety', 'Safety & Security'),
        ('Welfare', 'Student Welfare'),
        ('Policies', 'School Policies'),
        ('Activities', 'Student Activities'),
        ('Other', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Moderate', 'Moderate'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('Submitted', 'Submitted'),
        ('Acknowledged', 'Acknowledged'),
        ('Under Review', 'Under Review'),
        ('For Investigation', 'For Investigation'),
        ('Action Taken', 'Action Taken'),
        ('Resolved', 'Resolved'),
        ('Dismissed', 'Dismissed'),
    ]

    VISIBILITY_CHOICES = [
        ('Pending Review', 'Pending Review'),
        ('Community', 'Community'),
        ('Private', 'Private'),
        ('Hidden', 'Hidden'),
    ]

    reference_number = models.CharField(max_length=20, unique=True, db_index=True)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='freedom_wall_submissions')
    is_anonymous = models.BooleanField(default=False)
    
    submission_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=200, blank=True, null=True)
    
    student_reported_priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Low')
    official_priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Low')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Submitted')
    visibility = models.CharField(max_length=50, choices=VISIBILITY_CHOICES, default='Pending Review')
    upvotes = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_file = models.FileField(upload_to='resolutions/', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference_number} - {self.title} ({self.status})"

class CommunityComment(models.Model):
    submission = models.ForeignKey(FreedomWallSubmission, on_delete=models.CASCADE, related_name='community_comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='fw_comments')
    is_anonymous = models.BooleanField(default=False)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author} on {self.submission.reference_number}"

class CommunityReaction(models.Model):
    REACTION_CHOICES = [
        ('like', 'Like'),
        ('heart', 'Heart'),
        ('laugh', 'Laugh'),
        ('sad', 'Sad'),
        ('angry', 'Angry'),
    ]
    submission = models.ForeignKey(FreedomWallSubmission, on_delete=models.CASCADE, related_name='community_reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fw_reactions')
    reaction_type = models.CharField(max_length=20, choices=REACTION_CHOICES, default='like')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('submission', 'user')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user} reacted {self.reaction_type} to {self.submission.reference_number}"

class SubmissionResponse(models.Model):
    submission = models.ForeignKey(FreedomWallSubmission, on_delete=models.CASCADE, related_name='responses')
    director = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='fw_responses')
    content = models.TextField()
    is_internal_note = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Response to {self.submission.reference_number}"


class SubmissionReferral(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Referred', 'Referred'),
        ('Acknowledged', 'Acknowledged'),
        ('Completed', 'Completed'),
    ]

    submission = models.ForeignKey(FreedomWallSubmission, on_delete=models.CASCADE, related_name='referrals')
    referred_to = models.CharField(max_length=100) # e.g., 'Guidance Office', 'Security'
    reason = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='fw_referrals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Referral for {self.submission.reference_number} to {self.referred_to}"
