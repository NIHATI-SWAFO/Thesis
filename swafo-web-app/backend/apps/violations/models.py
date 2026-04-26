from django.db import models
from django.conf import settings
from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry

class Violation(models.Model):
    class Status(models.TextChoices):
        OPEN               = 'OPEN',               'Open'
        AWAITING_DECISION  = 'AWAITING_DECISION',  'Awaiting Decision'
        DECISION_RENDERED  = 'DECISION_RENDERED',  'Decision Rendered'
        DISMISSED          = 'DISMISSED',          'Dismissed'
        CLOSED             = 'CLOSED',             'Closed'

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='violations')
    officer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='recorded_violations')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_violations', blank=True)
    rule = models.ForeignKey(HandbookEntry, on_delete=models.PROTECT, related_name='violations')
    
    location = models.CharField(max_length=255)
    location_name = models.CharField(max_length=255, blank=True, help_text="Normalized location key matching the DLSUD_LOCATIONS lookup table")
    latitude  = models.FloatField(null=True, blank=True, help_text="Auto-populated from location_name lookup")
    longitude = models.FloatField(null=True, blank=True, help_text="Auto-populated from location_name lookup")
    description = models.TextField()
    evidence_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    
    # AI/Intelligent Output Fields
    case_summary = models.TextField(blank=True, help_text="Auto-generated concise summary of the case.")
    corrective_action = models.CharField(max_length=255, blank=True, help_text="System-recommended penalty based on history.")
    
    # Director Decision Fields
    director_sanction = models.CharField(max_length=255, blank=True, null=True, help_text="Formal sanction rendered by the Director.")
    director_remarks = models.TextField(blank=True, null=True, help_text="Justification/remarks for the Director's decision.")
    
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.student_number} - {self.rule.rule_code} ({self.timestamp.date()})"
