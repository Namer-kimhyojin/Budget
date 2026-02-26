import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ibms_backend.settings')
django.setup()

from budget_mgmt.models import BudgetSubject

UPDATES = [
    # 수입예산 (INCOME)
    ("INC_02", "기관의 설립 목적 달성 및 고유 목적사업 수행의 안정적 기반을 마련하기 위해 출연받는 자기자본 및 투입 재원"),
    ("INC_03", "기관의 설립 목적에 위배되지 않는 범위 내에서 경영 자립도 향상 등을 위해 독자적으로 영위하는 수익사업 수입"),
    ("INC_03_00", "기관의 경영 자립도 향상을 도모하고자 부수적으로 영위하는 수익 창출 사업 수입 총괄"),
    ("INC_04_00", "주된 사업 활동 외에 이자수익, 유휴자금 운용수익, 자산매각수대 등 부수적 또는 영업외 활동으로 발생하는 수입 총괄"),
    ("INC_04_01", "예금 이자, 지체상금, 위약금 등 법인의 영업 및 목적사업과 직접적 연관 없이 일시적·우발적으로 발생하는 수입액"),
    
    # 지출예산 (EXPENSE) - 자산취득, 단지관리 등 보완
    ("EXP_01_03", "기관 경영수행 및 일반 행정 유지를 목적으로 취득하는 내용연수 1년 이상, 기준단가 이상의 기계기구, 집기비품 등의 자본적 지출"),
    ("EXP_04_01", "수익 창출을 목적으로 위탁 또는 자체 관리하는 단지(임대시설, 장비 등)의 쾌적한 환경 유지 및 안전망 확보에 소요되는 제경비"),
    ("EXP_04_02", "수익사업 영위를 위한 시설, 건물, 비품의 최초 취득은 물론, 기존 자산의 가치 증대 및 내용연수 연장을 위한 자본적 지출"),
    ("EXP_05", "주된 목적사업이나 수익사업과 직접적인 관련 없이 재난, 사고 등 불가피한 사유나 우발적 상황으로 인해 발생하는 영업외 비용 및 예비비"),

    # 이월금 (자동 생성 항목 포함)
    ("이월금(전기)", "전년도 예산 중 집행 사유 미발생, 시기 미도래 등으로 인해 지방재정법 및 관련 규정에 따라 당해 연도로 합법적으로 이월된 자금"),
    ("이월금(차기)", "당해 연도 예산 중 부득이한 사유로 집행하지 못하고 다음 회계연도로 넘기기 위해 법적 절차(이월 승인 등)를 거친 자금"),
    ("이월금", "예산 성립 후 발생한 불가피한 사유(공기 지연, 미지급금 등)로 인해 당해 연도 내 지출을 마치지 못하고 차기 연도로 이월하여 사용하게 되는 금액"),
    
    # 지자체 및 기타 재원
    ("기타 지차제", "재정 지원 지자체 이외의 다른 지방자치단체로부터 특정 사업의 공동 추진 등을 목적으로 교부받은 보조금 및 분담금"),
    ("전입금", "지방자치단체의 일반회계 또는 특별회계로부터 기관의 설립 목적 수행 및 특정 사업 지원을 위해 정당한 절차를 거쳐 이전받는 자금"),
]

def run_update():
    count = 0
    # First apply specific code updates
    for code, desc in UPDATES:
        objs = BudgetSubject.objects.filter(code=code)
        if objs.exists():
            for obj in objs:
                obj.description = desc
                obj.save()
                count += 1
                print(f"Updated by CODE: {obj.code} ({obj.name})")
        else:
            # Fallback to name search if code didn't match
            objs_by_name = BudgetSubject.objects.filter(name=code)
            for obj in objs_by_name:
                obj.description = desc
                obj.save()
                count += 1
                print(f"Updated by NAME: {obj.name} (Code: {obj.code})")

    # For level 3 and 4 items, let's also specifically clarify "당해연도" based on its parent
    # It has no unique code often (INC_01_02_01 vs INC_01_01_01) but checking code starts with INC helps
    inc_cur_year = BudgetSubject.objects.filter(name="당해연도", subject_type="income", level=3)
    for obj in inc_cur_year:
        if obj.code.startswith("INC"):
            obj.description = "교부 주체(국가, 지자체 등)의 당해 연도 예산 편성 및 집행 지침에 따라 신규로 확정되어 교부받는 수익성 비수익성 예산액"
            obj.save()
            count += 1
            print(f"Updated by CUSTOM logic: {obj.code} ({obj.name})")

    print(f"Total supplementary descriptions updated: {count}")

if __name__ == "__main__":
    run_update()
