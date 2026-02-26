import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ibms_backend.settings')
django.setup()

from budget_mgmt.models import BudgetSubject

# Define updates: (code, level, new_description) or (name, level, new_description)
# I will use a mapping for safer updates.

UPDATES = [
    # EXPENSE (지출) - Jang (1)
    ("EXP_01", 1, "기관의 일반적인 관리 및 운영을 위해 소요되는 공통 경비"),
    ("EXP_02", 1, "기관의 고유 목적사업 수행 및 지원을 위해 직접적으로 소요되는 경비"),
    ("EXP_03", 1, "기관의 자기자본(자체재원)을 투입하여 수행하는 사업 관련 지출"),
    ("EXP_04", 1, "영리 또는 수익 창출을 목적으로 운영하는 사업의 제반 경비"),
    ("EXP_05", 1, "영업활동과 직접 관련 없이 발생하는 비용 및 예비비"),

    # INCOME (수입) - Jang (1)
    ("INC_01", 1, "기관의 주된 사업 활동(목적사업, 수익사업 등)을 통해 직접적으로 발생하는 모든 수입"),
    ("INC_04", 1, "주된 사업 활동 이외의 금융 활동이나 일시적인 원인으로 발생하는 비경상적 수입"),

    # Level 2 (Gwan) - Specific ones found in dump
    ("EXP_01_00", 2, "기관 경영의 투명성과 효율성 제고를 위한 일상적인 행정 관리 및 운영 사무 비용"),
    ("INC_01_01", 2, "지방자치단체 등으로부터 기관의 기초 체력 유지 및 운영 보조를 위해 교부받는 전입 수입"),
    ("INC_01_02", 2, "국가, 지자체 또는 외부 기관으로부터 특정 사업을 위탁받아 수행하기 위해 확보하는 사업 예산"),
]

# AUTO subjects based on names and levels
AUTO_UPDATES = [
    ("자기자본사업비", 2, "기관이 보유한 자체 재원을 활용하여 창의적·독자적으로 수행하는 사업의 직접 운영 비용"),
    ("단지운영비", 2, "관리 대상 입주 단지 및 부대 시설물의 안전하고 쾌적한 환경 유지를 위한 유지보수 및 운영 경비"),
    ("사업비(당해연도)", 2, "해당 회계연도 예산 편성 지침 및 지자체 승인에 따라 확정된 당해 연도 집행 사업비"),
    ("사업비(이월금)", 2, "전년도 예산 중 집행 사유 미발생 또는 시기 미도래로 법정 절차를 거쳐 이월된 사업 예산"),
    ("예비비", 3, "예산 편성 시점에 예측할 수 없었던 불가피한 지출 수요에 신속히 대응하기 위해 마련된 예비 재원"),
    ("예비비", 4, "예산 편성 시점에 예측할 수 없었던 불가피한 지출 수요에 신속히 대응하기 위해 마련된 예비 재원"),
]

def run_update():
    count = 0
    # Update by Code
    for code, level, desc in UPDATES:
        objs = BudgetSubject.objects.filter(code=code, level=level)
        for obj in objs:
            obj.description = desc
            obj.save()
            count += 1
            print(f"Updated {obj.code} ({obj.name})")

    # Update by Name and Level for AUTO ones
    for name, level, desc in AUTO_UPDATES:
        objs = BudgetSubject.objects.filter(name=name, level=level)
        for obj in objs:
            if not obj.description or obj.description.strip() == "":
                obj.description = desc
                obj.save()
                count += 1
                print(f"Updated AUTO {obj.name} (ID: {obj.id})")

    # Supplement some level 3/4 based on common knowledge if empty
    common_supplements = [
        ("인건비", "임직원의 기본급, 제수당, 퇴직급여 및 법정 부담금(4대보험) 등 인적 자원 유지에 소요되는 총체적 비용"),
        ("일반운영비", "사무관리비, 공공요금, 임차료, 여비 및 소모품비 등 기관 운영의 연속성 확보를 위한 필수적 경비"),
        ("직접사업비", "사업 계획에 명시된 목표 달성을 위해 현장에서 직접적으로 소비되는 재료비, 인건비 및 용역비"),
        ("간접사업비", "개별 사업의 원활한 수행을 측면 지원하기 위해 기관 전체적으로 소요되는 공통 관리 성격의 비용"),
        ("자산취득비", "내용연수가 1년 이상이고 취득가액이 일정 기준 이상인 토지, 건물, 기계장치 및 비품 등의 확보 비용"),
        ("전입금", "지방자치단체 일반회계 또는 특별회계로부터 기관의 운영이나 사업 지원을 위해 이전받는 자금"),
        ("국비", "국가 예산 지침에 따라 중앙정부로부터 특정 사업의 수행을 목적으로 교부받는 국고보조금"),
        ("도비", "광역지방자치단체(도)의 예산으로 편성되어 지역 내 사업 활성화를 위해 지원받는 보조금"),
        ("시비", "기초지방자치단체(시)의 자체 예산으로 편성되어 관할 구역 내 사업 추진을 위해 확보한 자금"),
        ("잡수익", "법인의 경상적인 영업활동 이외의 부수적인 활동에서 소액 또는 일시적으로 발생하는 기타 수입"),
    ]

    for name, desc in common_supplements:
        objs = BudgetSubject.objects.filter(name=name, description="")
        for obj in objs:
            obj.description = desc
            obj.save()
            count += 1
            print(f"Supplemented {obj.name} (ID: {obj.id})")

    print(f"Total updated: {count}")

if __name__ == "__main__":
    run_update()
