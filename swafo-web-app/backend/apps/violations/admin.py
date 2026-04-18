from django.contrib import admin
from .models import Violation

@admin.register(Violation)
class ViolationAdmin(admin.ModelAdmin):
    list_display = ('student', 'rule', 'status', 'timestamp')
    list_filter = ('status', 'rule__category')
    search_fields = ('student__student_number', 'rule__rule_code')
