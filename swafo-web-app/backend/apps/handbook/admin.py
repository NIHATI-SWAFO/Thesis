from django.contrib import admin
from .models import HandbookEntry

@admin.register(HandbookEntry)
class HandbookEntryAdmin(admin.ModelAdmin):
    list_display = ('rule_code', 'category', 'description')
    list_filter = ('category',)
    search_fields = ('rule_code', 'description')
