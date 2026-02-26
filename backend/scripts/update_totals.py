
import os
import django
import sys

# Setup Django environment
# Add the project root to sys.path
sys.path.append(r'D:\Budget\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budget_project.settings')
django.setup()

from budget_mgmt.models import BudgetEntry

def update_all_entries():
    entries = BudgetEntry.objects.all()
    count = entries.count()
    print(f"Updating {count} entries...")
    
    updated = 0
    for entry in entries:
        try:
            # We call update_totals which calculates and saves
            entry.update_totals()
            updated += 1
            if updated % 100 == 0:
                print(f"Updated {updated}/{count}")
        except Exception as e:
            print(f"Error updating entry {entry.id}: {e}")

    print(f"Done. Updated {updated} entries.")

if __name__ == "__main__":
    update_all_entries()
