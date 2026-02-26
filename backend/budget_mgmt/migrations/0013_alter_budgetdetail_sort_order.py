# Generated migration for sort_order field update

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('budget_mgmt', '0012_organization_parent'),
    ]

    operations = [
        migrations.AlterField(
            model_name='budgetdetail',
            name='sort_order',
            field=models.IntegerField(default=0),
        ),
    ]
