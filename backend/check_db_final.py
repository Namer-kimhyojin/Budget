import os
import django
import sys
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ibms_backend.settings')
django.setup()
from budget_mgmt.models import BudgetSubject
with open('db_subjects.txt', 'w', encoding='utf-8') as f:
    subjects = BudgetSubject.objects.all().order_by('code')
    f.write(f'Total: {subjects.count()}\n')
    for s in subjects:
        f.write(f'{s.code} | {s.name} | {s.level} | {s.parent.code if s.parent else \"None\"} | {s.subject_type}\n')
