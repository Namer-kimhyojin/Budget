import os
import sys

# Setup django environment
sys.path.append(r"d:\Budget\backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ibms_backend.settings')

import django
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from budget_mgmt.views import BudgetVersionViewSet
from budget_mgmt.models import BudgetVersion, Organization
from django.contrib.auth.models import User

print("Starting explicit test of excel export...")
version = BudgetVersion.objects.first()
org = Organization.objects.filter(name='경영지원실').first()
if not org:
    org = Organization.objects.first()

if not version or not org:
    print("Cannot find version or org.")
    sys.exit(0)

factory = APIRequestFactory()
request = factory.get(f'/api/versions/{version.id}/export-department-budget/', {'org_id': org.id})

user = User.objects.first()
if not user:
    user = User(username='test_admin', is_superuser=True)
    user.save()

force_authenticate(request, user=user)

view = BudgetVersionViewSet.as_view({'get': 'export_department_budget'})

try:
    response = view(request, pk=version.id)
    if hasattr(response, 'render') and callable(getattr(response, 'render')):
        response.render()
        
    with open(r"d:\Budget\test_export.xlsx", "wb") as f:
        f.write(response.content)
    print("Exported successfully to d:\\Budget\\test_export.xlsx")
except Exception as e:
    import traceback
    traceback.print_exc()
