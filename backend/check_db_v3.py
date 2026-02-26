import os
import django
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ibms_backend.settings')
django.setup()
from budget_mgmt.models import BudgetSubject
try:
    with open('db_subjects.txt', 'w', encoding='utf-8') as f:
        subjects = BudgetSubject.objects.all().order_by('code')
        f.write(f'Total: {subjects.count()}\n')
        for s in subjects:
            p_code = s.parent.code if s.parent else "None"
            f.write(f'{s.code} | {s.name} | {s.level} | {p_code} | {s.subject_type}\n')
    print("Success")
except Exception as e:
    print(f"Error: {e}")
