from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from budget_mgmt.models import UserProfile, Organization


DEMO_USERS = [
    {'username': 'admin', 'password': 'Admin!2345', 'name': 'System Admin', 'role': 'ADMIN'},
    {'username': 'reviewer', 'password': 'Reviewer!2345', 'name': 'Budget Reviewer', 'role': 'REVIEWER'},
    {'username': 'requestor', 'password': 'Requestor!2345', 'name': 'Budget Requestor', 'role': 'REQUESTOR'},
]


class Command(BaseCommand):
    help = 'Create demo auth users for login testing.'

    def add_arguments(self, parser):
        parser.add_argument('--reset-password', action='store_true', help='Reset password if user already exists.')

    def handle(self, *args, **options):
        reset_password = options['reset_password']
        default_org = Organization.objects.order_by('id').first()

        self.stdout.write(self.style.WARNING('Creating demo users...'))
        for item in DEMO_USERS:
            user, created = User.objects.get_or_create(
                username=item['username'],
                defaults={
                    'first_name': item['name'],
                    'email': f"{item['username']}@ibms.local",
                },
            )
            if created or reset_password:
                user.set_password(item['password'])
                if not user.first_name:
                    user.first_name = item['name']
                if not user.email:
                    user.email = f"{item['username']}@ibms.local"
                user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': item['role']})
            profile.role = item['role']
            if default_org and profile.organization_id is None:
                profile.organization = default_org
            profile.save()

            state = 'created' if created else 'updated'
            self.stdout.write(f"- {item['username']} ({item['role']}) {state}")

        self.stdout.write(self.style.SUCCESS('Done. Demo credentials:'))
        for item in DEMO_USERS:
            self.stdout.write(f"  {item['username']} / {item['password']}")
