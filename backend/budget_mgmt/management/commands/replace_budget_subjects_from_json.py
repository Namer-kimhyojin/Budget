import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from budget_mgmt.models import BudgetEntry, BudgetSubject


class Command(BaseCommand):
    help = 'Replace budget subject system from a JSON file.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            required=True,
            help='JSON file path containing budget_account_system payload.',
        )
        parser.add_argument(
            '--replace',
            action='store_true',
            help='Delete all BudgetEntry and BudgetSubject data before import.',
        )
        parser.add_argument(
            '--prune',
            action='store_true',
            help='Delete subjects not present in JSON (when --replace is not used).',
        )

    def handle(self, *args, **options):
        json_path = Path(options['file']).expanduser()
        if not json_path.is_absolute():
            json_path = Path.cwd() / json_path
        if not json_path.exists():
            raise CommandError(f'JSON file not found: {json_path}')

        payload = self._load_json(json_path)
        records = self._build_records(payload)
        self._validate_records(records)

        replace = bool(options.get('replace'))
        prune = bool(options.get('prune'))
        if replace and prune:
            raise CommandError('--replace and --prune cannot be used together.')

        result = self._apply_records(records, replace=replace, prune=prune)
        self.stdout.write(self.style.SUCCESS(
            'Import completed. '
            f"created={result['created']}, updated={result['updated']}, "
            f"deleted={result['deleted']}, total={result['total']}"
        ))
        self.stdout.write(
            f"income={result['income_count']}, expense={result['expense_count']}"
        )

    def _load_json(self, json_path: Path):
        try:
            with json_path.open('r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as exc:
            raise CommandError(f'Invalid JSON: {exc}') from exc

    def _build_records(self, payload):
        system = payload.get('budget_account_system', payload)
        income_root = system.get('income_budget')
        expense_root = system.get('expense_budget')
        if not income_root or not expense_root:
            raise CommandError('JSON must contain income_budget and expense_budget.')

        records = []

        def walk(node, subject_type, level, parent_code, sort_order):
            code = str(node.get('code') or '').strip()
            name = str(node.get('name') or '').strip()
            description = str(node.get('description') or '').strip()
            if not code:
                raise CommandError(f'Missing code at level={level}, parent={parent_code}')
            if not name:
                raise CommandError(f'Missing name at code={code}')
            if level < 1 or level > 4:
                raise CommandError(f'Unsupported level {level} at code={code}.')

            records.append({
                'code': code,
                'name': name,
                'description': description,
                'level': level,
                'parent_code': parent_code,
                'subject_type': subject_type,
                'sort_order': sort_order,
            })

            children = node.get('children') or []
            for idx, child in enumerate(children):
                walk(child, subject_type, level + 1, code, idx)

        for idx, child in enumerate(income_root.get('children') or []):
            walk(child, 'income', 1, None, idx)
        for idx, child in enumerate(expense_root.get('children') or []):
            walk(child, 'expense', 1, None, idx)

        return records

    def _validate_records(self, records):
        seen = set()
        for rec in records:
            code = rec['code']
            if len(code) > 20:
                raise CommandError(f'Code too long (max 20): {code}')
            if code in seen:
                raise CommandError(f'Duplicate code in JSON: {code}')
            seen.add(code)

    def _apply_records(self, records, replace=False, prune=False):
        created = 0
        updated = 0
        deleted = 0

        sorted_records = sorted(records, key=lambda rec: (rec['level'], rec['sort_order']))
        incoming_codes = {rec['code'] for rec in records}

        with transaction.atomic():
            if replace:
                entry_count = BudgetEntry.objects.count()
                subject_count = BudgetSubject.objects.count()
                BudgetEntry.objects.all().delete()
                BudgetSubject.objects.all().delete()
                self.stdout.write(f'Deleted BudgetEntry: {entry_count}')
                self.stdout.write(f'Deleted BudgetSubject: {subject_count}')

            code_to_obj = {obj.code: obj for obj in BudgetSubject.objects.all()}

            for rec in sorted_records:
                parent = code_to_obj.get(rec['parent_code']) if rec['parent_code'] else None
                defaults = {
                    'name': rec['name'],
                    'description': rec['description'],
                    'level': rec['level'],
                    'parent': parent,
                    'subject_type': rec['subject_type'],
                    'sort_order': rec['sort_order'],
                }
                obj, was_created = BudgetSubject.objects.update_or_create(
                    code=rec['code'],
                    defaults=defaults,
                )
                code_to_obj[rec['code']] = obj
                if was_created:
                    created += 1
                else:
                    updated += 1

            if prune and not replace:
                stale_qs = BudgetSubject.objects.exclude(code__in=incoming_codes)
                stale_count = stale_qs.count()
                if stale_count:
                    stale_qs.delete()
                    deleted += stale_count

        income_count = BudgetSubject.objects.filter(subject_type='income').count()
        expense_count = BudgetSubject.objects.filter(subject_type='expense').count()
        total = BudgetSubject.objects.count()
        return {
            'created': created,
            'updated': updated,
            'deleted': deleted,
            'income_count': income_count,
            'expense_count': expense_count,
            'total': total,
        }
