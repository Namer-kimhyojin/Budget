from django.core.management.base import BaseCommand
from budget_mgmt.models import Organization, BudgetSubject, BudgetEntry, BudgetDetail
from django.contrib.auth.models import User
from budget_mgmt.models import UserProfile

class Command(BaseCommand):
    help = 'Seed initial data'

    def handle(self, *args, **options):
        # 1. Organizations
        orgs_data = [
            {'id': 'MGMT', 'name': '경영지원실', 'type': 'dept'},
            {'id': 'STRT', 'name': '전략사업본부', 'type': 'dept'},
            {'id': 'ENER', 'name': '에너지사업본부', 'type': 'dept'},
            {'id': 'BIO', 'name': '바이오사업본부', 'type': 'dept'},
            {'id': 'DIGT', 'name': '경북디지털혁신본부', 'type': 'dept'},
            {'id': 'AUDT', 'name': '감사팀', 'type': 'dept'},
        ]
        org_map = {}
        for d in orgs_data:
            org, _ = Organization.objects.get_or_create(code=d['id'], defaults={'name': d['name'], 'org_type': d['type']})
            org_map[d['id']] = org

        # 2. Budget Subjects
        subjects_data = [
            {'id': '1000', 'code': '1000', 'name': '사업수입', 'level': 1, 'type': 'income'},
            {'id': '1100', 'code': '1100', 'name': '재단운영수입', 'level': 2, 'parent': '1000', 'type': 'income'},
            {'id': '1110', 'code': '1110', 'name': '이월금(전기)', 'level': 3, 'parent': '1100', 'type': 'income'},
            {'id': '1111', 'code': '1111', 'name': '이월금', 'level': 4, 'parent': '1110', 'type': 'income'},
            {'id': '1120', 'code': '1120', 'name': '임대료', 'level': 3, 'parent': '1100', 'type': 'income'},
            {'id': '1121', 'code': '1121', 'name': '보증금', 'level': 4, 'parent': '1120', 'type': 'income'},
            {'id': '1200', 'code': '1200', 'name': '수익사업수입', 'level': 2, 'parent': '1000', 'type': 'income'},
            {'id': '1210', 'code': '1210', 'name': '수익사업수입', 'level': 3, 'parent': '1200', 'type': 'income'},
            {'id': '1211', 'code': '1211', 'name': '임대료수입', 'level': 4, 'parent': '1210', 'type': 'income'},
            {'id': '1212', 'code': '1212', 'name': '관리비수입', 'level': 4, 'parent': '1210', 'type': 'income'},
            {'id': '1213', 'code': '1213', 'name': '이자수입', 'level': 4, 'parent': '1210', 'type': 'income'},
            {'id': '1300', 'code': '1300', 'name': '목적사업수입', 'level': 2, 'parent': '1000', 'type': 'income'},
            {'id': '1310', 'code': '1310', 'name': '정부보조금', 'level': 3, 'parent': '1300', 'type': 'income'},

            {'id': '2000', 'code': '2000', 'name': '사업지출', 'level': 1, 'type': 'expense'},
            {'id': '2100', 'code': '2100', 'name': '재단운영비지출', 'level': 2, 'parent': '2000', 'type': 'expense'},
            {'id': '2111', 'code': '2111', 'name': '인건비', 'level': 3, 'parent': '2100', 'type': 'expense'},
            {'id': '2112', 'code': '2112', 'name': '기본급', 'level': 4, 'parent': '2111', 'type': 'expense'},
            {'id': '2113', 'code': '2113', 'name': '제수당', 'level': 4, 'parent': '2111', 'type': 'expense'},
            {'id': '2114', 'code': '2114', 'name': '인건부담금(보험)', 'level': 4, 'parent': '2111', 'type': 'expense'},
            {'id': '2200', 'code': '2200', 'name': '목적사업비', 'level': 2, 'parent': '2000', 'type': 'expense'},
            {'id': '2210', 'code': '2210', 'name': '거점기능강화사업', 'level': 3, 'parent': '2200', 'type': 'expense'},
            {'id': '2211', 'code': '2211', 'name': '직접사업비', 'level': 4, 'parent': '2210', 'type': 'expense'},
            {'id': '2300', 'code': '2300', 'name': '자기자본사업지출', 'level': 2, 'parent': '2000', 'type': 'expense'},
            {'id': '2310', 'code': '2310', 'name': '자기자본사업비', 'level': 3, 'parent': '2300', 'type': 'expense'},
            {'id': '2311', 'code': '2311', 'name': '직접사업비', 'level': 4, 'parent': '2310', 'type': 'expense'},
            {'id': '2400', 'code': '2400', 'name': '수익사업지출', 'level': 2, 'parent': '2000', 'type': 'expense'},
            {'id': '2410', 'code': '2410', 'name': 'KOLAS운영비', 'level': 3, 'parent': '2400', 'type': 'expense'},
            {'id': '2411', 'code': '2411', 'name': '직접사업비', 'level': 4, 'parent': '2410', 'type': 'expense'},
            {'id': '2420', 'code': '2420', 'name': '단지운영비', 'level': 3, 'parent': '2400', 'type': 'expense'},
            {'id': '2421', 'code': '2421', 'name': '단지관리비', 'level': 4, 'parent': '2420', 'type': 'expense'},
        ]
        sub_map = {}
        for d in subjects_data:
            parent = sub_map.get(d.get('parent'))
            sub, _ = BudgetSubject.objects.get_or_create(
                code=d['code'], 
                defaults={'name': d['name'], 'level': d['level'], 'parent': parent, 'subject_type': d['type']}
            )
            sub_map[d['code']] = sub

        # 4. Create Initial Budget Entries and Details
        # Example: Strategy Dept (STRT) - Marketing Expense (홍보비 2210 -> 2211 직접사업비)
        entry, _ = BudgetEntry.objects.get_or_create(
            subject=sub_map['2211'],
            organization=org_map['STRT'],
            year=2026,
            defaults={'status': 'DRAFT', 'last_year_amount': 150000000}
        )

        BudgetDetail.objects.get_or_create(
            entry=entry,
            name='신규 프로젝트 통합 홍보 (SNS)',
            defaults={
                'price': 1000000,
                'qty': 10,
                'freq': 12,
                'unit': '회',
                'organization': org_map['STRT']
            }
        )
        BudgetDetail.objects.get_or_create(
            entry=entry,
            name='오프라인 전시회 참가비',
            defaults={
                'price': 5000000,
                'qty': 2,
                'freq': 1,
                'unit': '회',
                'organization': org_map['STRT']
            }
        )

        # Example: Management Dept (MGMT) - R&D Income (사업수입 1000 -> 1211 임대료수입)
        income_entry, _ = BudgetEntry.objects.get_or_create(
            subject=sub_map['1211'],
            organization=org_map['MGMT'],
            year=2026,
            defaults={'status': 'FINALIZED', 'last_year_amount': 200000000}
        )
        BudgetDetail.objects.get_or_create(
            entry=income_entry,
            name='벤처기업 단지 임대료 (A동)',
            defaults={
                'price': 2500000,
                'qty': 10,
                'freq': 12,
                'unit': '호',
                'organization': org_map['MGMT']
            }
        )

        # 5. Create Demo Users
        user, _ = User.objects.get_or_create(username='admin', defaults={'is_staff': True, 'is_superuser': True})
        user.set_password('admin123')
        user.save()
        UserProfile.objects.get_or_create(user=user, defaults={'role': 'ADMIN', 'organization': org_map['MGMT']})

        user_req, _ = User.objects.get_or_create(username='requestor', defaults={'is_staff': False})
        user_req.set_password('pass123')
        user_req.save()
        UserProfile.objects.get_or_create(user=user_req, defaults={'role': 'REQUESTOR', 'organization': org_map['STRT']})

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded initial data. Created {BudgetEntry.objects.count()} entries and users.'))
