import os
import django
import sys
sys.path.append(os.path.dirname(os.path.abspath('__file__')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ibms_backend.settings')
django.setup()
from budget_mgmt.models import BudgetSubject
subjects = BudgetSubject.objects.all().order_by('code')
for s in subjects:
    print(f'{s.code} | {s.name} | {s.level} | {s.parent.code if s.parent else \"None\"}')
