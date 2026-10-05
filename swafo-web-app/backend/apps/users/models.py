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

    def __str__(self):
        return f"{self.student_number} - {self.user.full_name}"
