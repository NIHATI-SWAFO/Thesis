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
