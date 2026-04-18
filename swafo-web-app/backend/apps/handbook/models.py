from django.db import models

class HandbookEntry(models.Model):
    rule_code = models.CharField(max_length=20, unique=True, help_text="e.g. 27.3.1.20")
    category = models.CharField(max_length=100)
    description = models.TextField()
    penalty_1st = models.CharField(max_length=255, null=True, blank=True)
    penalty_2nd = models.CharField(max_length=255, null=True, blank=True)
    penalty_3rd = models.CharField(max_length=255, null=True, blank=True)
    penalty_4th = models.CharField(max_length=255, null=True, blank=True)
    penalty_5th = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.rule_code} - {self.category}"
