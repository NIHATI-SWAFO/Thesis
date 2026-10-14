from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        OFFICER = 'OFFICER', 'Officer'
        ADMIN = 'ADMIN', 'Admin'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT
    )
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)

    # Use email as username
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)

    must_change_password = models.BooleanField(default=False)
    officer_badge = models.CharField(max_length=50, blank=True, null=True, default='Staff Officer')

    # Real-time presence tracking (online when logged in & active within the last 5 minutes)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(blank=True, null=True)

    # Soft deletion flag
    is_deleted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if ',' in (self.full_name or ''):
            parts = [p.strip() for p in self.full_name.split(',', 1)]
            if len(parts) == 2:
                self.full_name = f"{parts[1]} {parts[0]}".strip()
        elif not self.full_name and (self.first_name or self.last_name):
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    
    # DLSU-D Student Number Validation (9 digits)
    student_number = models.CharField(
        max_length=9,
        unique=True,
        validators=[RegexValidator(r'^\d{9}$', message="ID must be exactly 9 digits.")]
    )
    
    course = models.CharField(max_length=100)
    year_level = models.IntegerField(default=1)
    
    # Director Oversight Fields
    clearance_status = models.CharField(
        max_length=20, 
        choices=[('CLEARED', 'Cleared'), ('HOLD', 'Hold')], 
        default='CLEARED'
    )
    risk_score = models.FloatField(default=0.0) # Temporal Decay Score
    
    # Future barcode mapping
    barcode_value = models.CharField(max_length=255, blank=True, null=True)
    is_id_confirmed = models.BooleanField(default=False)

    # Student Profile Picture (Base64 data URI or image URL)
    profile_picture = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.student_number} - {self.user.full_name}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, blank=True, null=True)
    reference_id = models.IntegerField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token_hash = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reset token for {self.user.email} (used={self.is_used})"

class PasswordResetRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_requests', null=True, blank=True)
    officer_name = models.CharField(max_length=255)
    officer_email = models.EmailField()
    officer_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_reset_requests')

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Reset request for {self.officer_email} [{self.status}]"

class SecurityAuditLog(models.Model):
    action = models.CharField(max_length=100)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs_as_actor')
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs_as_target')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.action} by {self.actor or 'System'}"

