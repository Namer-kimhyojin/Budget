from django.core.management.base import BaseCommand
from django.db import transaction
from budget_mgmt.models import BudgetSubject, BudgetEntry

class Command(BaseCommand):
    help = 'Initialize Budget Subjects based on 2026 Guidelines'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Delete existing BudgetEntry and BudgetSubject records before initializing.',
        )

    def handle(self, *args, **options):
        if not options.get('force'):
            self.stdout.write(self.style.WARNING(
                'Aborted. Use --force to delete existing data before initializing.'
            ))
            return

        with transaction.atomic():
            # 0. Clear existing data
            # Delete BudgetEntry first because of Protected Foreign Key
            BudgetEntry.objects.all().delete()
            self.stdout.write("Cleared existing BudgetEntry data.")
            
            BudgetSubject.objects.all().delete()
            self.stdout.write("Cleared existing BudgetSubject data.")

        # Data structure: (code, name, level, subject_type, parent_code)
        
        # --- INCOME (수입) ---
        # 1. 사업수입 (1000)
        self.create_subject('1000', '사업수입', 1, 'income', None)
        
        # 1.1 재단운영수입 (1100)
        self.create_subject('1100', '재단운영수입', 2, 'income', '1000')
        self.create_subject('1110', '당해연도', 3, 'income', '1100')
        self.create_subject('1111', '당해연도', 4, 'income', '1110')
        self.create_subject('1120', '이월금', 3, 'income', '1100')
        self.create_subject('1121', '이월금', 4, 'income', '1120')

        # 1.2 목적사업수입 (1200)
        self.create_subject('1200', '목적사업수입', 2, 'income', '1000')
        self.create_subject('1210', '당해연도', 3, 'income', '1200')
        self.create_subject('1211', '국비', 4, 'income', '1210')
        self.create_subject('1212', '도비', 4, 'income', '1210')
        self.create_subject('1213', '시(군)비', 4, 'income', '1210')
        self.create_subject('1214', '민간', 4, 'income', '1210')
        self.create_subject('1220', '이월금', 3, 'income', '1200')
        self.create_subject('1221', '국비', 4, 'income', '1220')
        self.create_subject('1222', '도비', 4, 'income', '1220')
        self.create_subject('1223', '시(군)비', 4, 'income', '1220')
        self.create_subject('1224', '민간', 4, 'income', '1220')

        # 1.3 자기자본수입 (1300)
        self.create_subject('1300', '자기자본수입', 2, 'income', '1000')
        self.create_subject('1310', '재단출연금', 3, 'income', '1300')
        self.create_subject('1311', '재단출연금', 4, 'income', '1310')

        # 1.4 수익사업수입 (1400)
        self.create_subject('1400', '수익사업수입', 2, 'income', '1000')
        self.create_subject('1410', '수익사업수입', 3, 'income', '1400')
        self.create_subject('1411', '임대료수입', 4, 'income', '1410')
        self.create_subject('1412', '관리비수입', 4, 'income', '1410')
        self.create_subject('1413', '이자수입', 4, 'income', '1410')
        self.create_subject('1414', '장비활용수입', 4, 'income', '1410')
        
        # 2. 사업외수입 (2000)
        self.create_subject('2000', '사업외수입', 1, 'income', None)
        self.create_subject('2100', '사업외수입', 2, 'income', '2000')
        self.create_subject('2110', '사업외수입', 3, 'income', '2100')
        self.create_subject('2111', '기타사업외수입', 4, 'income', '2110')
        
        
        # --- EXPENSE (지출) ---
        # 3. 재단운영비 (3000)
        self.create_subject('3000', '재단운영비', 1, 'expense', None)
        self.create_subject('3100', '재단운영비지출', 2, 'expense', '3000')
        self.create_subject('3110', '인건비', 3, 'expense', '3100')
        self.create_subject('3111', '기본급', 4, 'expense', '3110')
        self.create_subject('3112', '제수당', 4, 'expense', '3110')
        self.create_subject('3113', '연금부담금', 4, 'expense', '3110')
        self.create_subject('3114', '퇴직급여', 4, 'expense', '3110')
        self.create_subject('3115', '성과급', 4, 'expense', '3110')

        self.create_subject('3120', '일반운영비', 3, 'expense', '3100')
        self.create_subject('3121', '임차료', 4, 'expense', '3120')
        self.create_subject('3122', '여비교통비', 4, 'expense', '3120')
        self.create_subject('3123', '도서인쇄비', 4, 'expense', '3120')
        self.create_subject('3124', '통신비', 4, 'expense', '3120')
        self.create_subject('3125', '세금과공과', 4, 'expense', '3120')
        self.create_subject('3126', '보험료', 4, 'expense', '3120')
        self.create_subject('3127', '복리후생비', 4, 'expense', '3120')
        self.create_subject('3128', '소모품비', 4, 'expense', '3120')
        self.create_subject('3129', '회의행사비', 4, 'expense', '3120')
        self.create_subject('3130', '차량유지비', 4, 'expense', '3120')
        self.create_subject('3131', '교육훈련비', 4, 'expense', '3120')
        self.create_subject('3132', '지급수수료', 4, 'expense', '3120')
        self.create_subject('3133', '장비유지관리비', 4, 'expense', '3120')
        self.create_subject('3134', '급식비(야근)', 4, 'expense', '3120')
        self.create_subject('3135', '기관운영업무추진비', 4, 'expense', '3120')
        self.create_subject('3136', '부서운영업무추진비', 4, 'expense', '3120')
        self.create_subject('3137', '사업추진업무추진비', 4, 'expense', '3120')
        self.create_subject('3138', '기타잡비', 4, 'expense', '3120')

        self.create_subject('3140', '자산취득비', 3, 'expense', '3100')
        self.create_subject('3141', '비품', 4, 'expense', '3140')

        # 4. 목적사업비 (4000)
        self.create_subject('4000', '목적사업비', 1, 'expense', None)
        self.create_subject('4100', '목적사업비', 2, 'expense', '4000')
        
        self.create_subject('4110', '인건비', 3, 'expense', '4100')
        self.create_subject('4111', '인건비', 4, 'expense', '4110')
        
        self.create_subject('4120', '직접사업비', 3, 'expense', '4100')
        self.create_subject('4121', '임차료', 4, 'expense', '4120')
        self.create_subject('4122', '여비교통비', 4, 'expense', '4120')
        self.create_subject('4123', '도서인쇄비', 4, 'expense', '4120')
        self.create_subject('4124', '광고선전비', 4, 'expense', '4120')
        self.create_subject('4125', '소모품비', 4, 'expense', '4120')
        self.create_subject('4126', '재료구입비', 4, 'expense', '4120')
        self.create_subject('4127', '시제품제작비', 4, 'expense', '4120')
        self.create_subject('4128', '회의행사비', 4, 'expense', '4120')
        self.create_subject('4129', '사업추진비', 4, 'expense', '4120')
        self.create_subject('4130', '교육훈련비', 4, 'expense', '4120')
        self.create_subject('4131', '지급수수료', 4, 'expense', '4120')
        self.create_subject('4132', '전문가활용비', 4, 'expense', '4120')
        self.create_subject('4133', '장비유지관리비', 4, 'expense', '4120')
        self.create_subject('4134', '조사분석비', 4, 'expense', '4120')
        self.create_subject('4135', '위탁용역비', 4, 'expense', '4120')
        # 추가 항목들
        self.create_subject('4136', '기업지원비', 4, 'expense', '4120')
        self.create_subject('4137', '전출금', 4, 'expense', '4120')
        self.create_subject('4138', '시설비및부대비', 4, 'expense', '4120')
        self.create_subject('4139', '연구수당', 4, 'expense', '4120')
        self.create_subject('4140', '반환금', 4, 'expense', '4120')
        self.create_subject('4141', '유지관리비', 4, 'expense', '4120')
        self.create_subject('4142', '수도광열비', 4, 'expense', '4120')
        self.create_subject('4143', '자산취득비', 4, 'expense', '4120')

        self.create_subject('4150', '간접사업비', 3, 'expense', '4100')
        self.create_subject('4151', '간접사업비', 4, 'expense', '4150')

        # 5. 자기자본사업비 (5000)
        self.create_subject('5000', '자기자본사업비', 1, 'expense', None)
        self.create_subject('5100', '직접사업비', 2, 'expense', '5000')
        self.create_subject('5110', '직접사업비', 3, 'expense', '5100')
        self.create_subject('5111', '펀드조성출자금', 4, 'expense', '5110')
        self.create_subject('5112', '현금출연금', 4, 'expense', '5110')

        # 6. 수익사업지출 (6000)
        self.create_subject('6000', '수익사업지출', 1, 'expense', None)
        self.create_subject('6100', '단지관리비', 2, 'expense', '6000')
        
        self.create_subject('6110', '시설관리비', 3, 'expense', '6100')
        self.create_subject('6111', '시설관리비', 4, 'expense', '6110')

        self.create_subject('6120', '청소관리비', 3, 'expense', '6100')
        self.create_subject('6121', '청소관리비', 4, 'expense', '6120')

        self.create_subject('6130', '방범관리비', 3, 'expense', '6100')
        self.create_subject('6131', '방범관리비', 4, 'expense', '6130')

        self.create_subject('6140', '조경관리비', 3, 'expense', '6100')
        self.create_subject('6141', '조경관리비', 4, 'expense', '6140')

        self.create_subject('6150', '수선유지비', 3, 'expense', '6100')
        self.create_subject('6151', '수선유지비', 4, 'expense', '6150')

        self.create_subject('6160', '환경안전보건관리비', 3, 'expense', '6100')
        self.create_subject('6161', '환경안전보건관리비', 4, 'expense', '6160')

        self.create_subject('6170', '승강기유지비', 3, 'expense', '6100')
        self.create_subject('6171', '승강기유지비', 4, 'expense', '6170')

        self.create_subject('6180', '정보이용시스템유지비', 3, 'expense', '6100')
        self.create_subject('6181', '정보이용시스템유지비', 4, 'expense', '6180')

        self.create_subject('6190', '전기료', 3, 'expense', '6100')
        self.create_subject('6191', '전기료', 4, 'expense', '6190')

        self.create_subject('6200', '도시가스료', 3, 'expense', '6100')
        self.create_subject('6201', '도시가스료', 4, 'expense', '6200')

        self.create_subject('6210', '상하수도료', 3, 'expense', '6100')
        self.create_subject('6211', '상하수도료', 4, 'expense', '6210')

        self.create_subject('6220', '음식물수거비', 3, 'expense', '6100')
        self.create_subject('6221', '음식물수거비', 4, 'expense', '6220')

        self.create_subject('6230', '세금과공과(단지)', 3, 'expense', '6100')
        self.create_subject('6231', '세금과공과(단지)', 4, 'expense', '6230')

        self.create_subject('6240', '자산취득비(수익)', 2, 'expense', '6000') # Section?
        # Guideline structure for Asset:
        # Chapter: 수익사업지출
        # Section: 자산취득비(수익) -> Or Item under 단지관리비?
        # Image says: "Section: 자산취득비(수익)" under Chapter: 수익사업지출.
        # But image shows "단지관리비" as a Classification (Section?)
        # Let's check image carefully: "구분: 자기자본사업비 / 수익사업지출"
        # Under 수익사업지출: "구분" (Section level?) -> "단지관리비", "자산취득비(수익)"
        # So "자산취득비(수익)" is a sibling of "단지관리비".
        self.create_subject('6250', '건물', 3, 'expense', '6240')
        self.create_subject('6251', '건물', 4, 'expense', '6250')
        self.create_subject('6260', '비품', 3, 'expense', '6240')
        self.create_subject('6261', '비품', 4, 'expense', '6260')

        # 7. 사업외비용 (7000)
        self.create_subject('7000', '사업외비용', 1, 'expense', None)
        self.create_subject('7100', '예비비', 2, 'expense', '7000')
        self.create_subject('7110', '예비비', 3, 'expense', '7100')
        self.create_subject('7111', '예비비', 4, 'expense', '7110')

        self.stdout.write(self.style.SUCCESS(f'Successfully initialized {BudgetSubject.objects.count()} Budget Subjects.'))


    def create_subject(self, code, name, level, subject_type, parent_code):
        parent = None
        if parent_code:
            try:
                parent = BudgetSubject.objects.get(code=parent_code)
            except BudgetSubject.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Parent {parent_code} not found for {code}'))
                return

        BudgetSubject.objects.create(
            code=code,
            name=name,
            level=level,
            subject_type=subject_type,
            parent=parent
        )
