from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('budget_mgmt', '0006_entrustedproject_alter_budgetentry_unique_together_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='budgetdetail',
            name='region_context',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='budgetdetail',
            name='weather_context',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='budgetdetail',
            name='evidence_source_name',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='budgetdetail',
            name='evidence_source_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='budgetdetail',
            name='evidence_as_of',
            field=models.DateField(blank=True, null=True),
        ),
    ]

