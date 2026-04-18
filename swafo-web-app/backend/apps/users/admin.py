from django.contrib import admin
from .models import User, StudentProfile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')
    search_fields = ('email', 'full_name')

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('student_number', 'user', 'course', 'year_level')
    search_fields = ('student_number', 'user__full_name')
