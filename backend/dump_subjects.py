import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ibms_backend.settings')
django.setup()

from budget_mgmt.models import BudgetSubject

subjects = BudgetSubject.objects.all().order_by('subject_type', 'code')
with open('subjects_dump.txt', 'w', encoding='utf-8') as f:
    for s in subjects:
        f.write(f"ID: {s.id} | Code: {s.code} | Name: {s.name} | Level: {s.level} | Desc: {s.description}\n")
