from django.contrib import admin
from .models import FreedomWallSubmission, SubmissionResponse, SubmissionReferral

@admin.register(FreedomWallSubmission)
class FreedomWallSubmissionAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'title', 'submission_type', 'category', 'status', 'created_at')
    list_filter = ('submission_type', 'category', 'status', 'official_priority')
    search_fields = ('reference_number', 'title', 'description')

@admin.register(SubmissionResponse)
class SubmissionResponseAdmin(admin.ModelAdmin):
    list_display = ('submission', 'director', 'is_internal_note', 'created_at')
    list_filter = ('is_internal_note',)

@admin.register(SubmissionReferral)
class SubmissionReferralAdmin(admin.ModelAdmin):
    list_display = ('submission', 'referred_to', 'status', 'created_at')
    list_filter = ('status', 'referred_to')
