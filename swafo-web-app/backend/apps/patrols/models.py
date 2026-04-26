from django.db import models
from django.conf import settings

class PatrolSession(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    officer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patrols')
    location = models.CharField(max_length=255)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)
    
    # Checkpoints stored as JSON for flexibility in the prototype
    checkpoints_data = models.JSONField(default=list, blank=True)
    
    # Form data from mobile
    shift_type = models.CharField(max_length=50, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    
    # Performance metrics
    photos_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Patrol {self.id} - {self.location} ({self.officer.full_name})"
