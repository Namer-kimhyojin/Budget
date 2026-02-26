# IBMS API Spec Draft (Menu-Centric)

## 1. 문서 개요
- 문서명: `IBMS API Spec Draft`
- 작성일: `2026-02-12`
- 기준 코드: `backend/budget_mgmt/urls.py`, `backend/budget_mgmt/views.py`, `backend/budget_mgmt/models.py`
- 목적: 메뉴별 프로세스를 API 계약으로 정리하고, 현재 제공 API(`As-Is`)와 추가 개발 API(`To-Be`)를 구분한다.

## 2. 공통 규칙
1. Base URL: `/api`
2. 인증 방식: `Authorization: Token <token>`
3. 기본 응답 형식:
4. 성공: DRF 기본 JSON(리소스/배열/페이지네이션)
5. 실패: `{"error": "message", "details": "...", "trace_id": "..."}` 패턴(일부 엔드포인트)
6. 페이지네이션: DRF 기본 페이지네이션(`results`) 적용 가능
7. 날짜/시간: ISO8601

## 3. 역할/상태 코드(현재 기준)

### 3.1 역할 코드(As-Is)
- `REQUESTOR`: 편성/상신
- `REVIEWER`: 부서 승인(검토 승인)
- `ADMIN`: 총무/관리자 권한

### 3.2 예산 상태 코드(As-Is)
- `DRAFT` -> `PENDING` -> `REVIEWING` -> `FINALIZED`
- 반려/회수 시 `DRAFT` 복귀

### 3.3 회차 상태 코드(As-Is)
- `DRAFT`, `PENDING`, `CONFIRMED` (`BudgetVersion.status`)

## 4. As-Is 엔드포인트 카탈로그

### 4.1 Auth/User
- `POST /auth/signup/`
- `POST /auth/login/`
- `POST /auth/logout/`
- `GET /auth/me/`
- `POST /auth/find-id/`
- `POST /auth/withdraw/`
- `POST /auth/assign-role/`
- `POST /auth/change-password/`
- `GET /auth/password-policy/`
- `GET /auth/users/` (admin)
- `POST /auth/users/` (admin)
- `PATCH /auth/users/{user_id}/` (admin)
- `DELETE /auth/users/{user_id}/` (admin)

### 4.2 기준정보/편성
- `GET|POST /orgs/`
- `GET|PATCH|DELETE /orgs/{id}/`
- `GET|POST /subjects/`
- `GET|PATCH|DELETE /subjects/{id}/`
- `POST /subjects/bulk-update-tree/`
- `GET|POST /entrusted-projects/`
- `GET|PATCH|DELETE /entrusted-projects/{id}/`
- `GET|POST /entries/`
- `GET|PATCH|DELETE /entries/{id}/`
- `POST /entries/{id}/submit/`
- `POST /entries/{id}/approve/`
- `POST /entries/{id}/reject/`
- `POST /entries/{id}/reopen/`
- `POST /entries/{id}/recall/`
- `POST /entries/workflow/` (부서 단위 일괄 워크플로우)
- `GET|POST /details/`
- `GET|PATCH|DELETE /details/{id}/`
- `POST /details/parse_expression/`

### 4.3 회차/집행/전용
- `GET|POST /versions/`
- `GET|PATCH|DELETE /versions/{id}/`
- `POST /versions/create_next_round/`
- `GET|POST /executions/`
- `GET|PATCH|DELETE /executions/{id}/`
- `GET|POST /transfers/`
- `GET|PATCH|DELETE /transfers/{id}/`
- `POST /transfers/{id}/approve/`
- `POST /transfers/{id}/reject/`

### 4.4 프로필/이력/알림
- `GET /profiles/`
- `GET /profiles/me/`
- `GET /logs/`
- `GET|POST /notifications/`
- `GET|PATCH|DELETE /notifications/{id}/`

### 4.5 ERPNext
- `GET /erpnext/me/`
- `POST /erpnext/budgets/sync/`
- `POST /erpnext/closing-voucher/`

## 5. 메뉴별 API 매핑 (To-Be 포함)

## 5.1 대시보드
- As-Is 사용 가능:
1. `GET /entries/?year=&round=&org_id=`
2. `GET /logs/`
3. `GET /notifications/`
- To-Be 추가 권장:
1. `GET /dashboard/summary/?year=&round=`
2. `GET /dashboard/departments/?year=&round=`
- 결정사항:
1. 집계 계산을 서버에서 확정(프론트 집계 최소화)

## 5.2 예산 접수(회차) 관리
- As-Is 사용 가능:
1. `GET /versions/`
2. `POST /versions/create_next_round/`
3. `PATCH /versions/{id}/`
- To-Be 추가 권장:
1. `POST /versions/{id}/open/`
2. `POST /versions/{id}/close/`
3. `POST /versions/{id}/confirm/`
- 결정사항:
1. 회차 상태와 Entry 상태의 동기화 규칙 필요

## 5.3 예산 편성/관리
- As-Is 사용 가능:
1. `GET /entries/`, `POST /entries/`, `PATCH /entries/{id}/`
2. `GET /details/`, `POST /details/`, `PATCH /details/{id}/`
3. `POST /details/parse_expression/`
- To-Be 추가 권장:
1. `POST /entries/bulk-upsert/` (엑셀형 대량 반영)
2. `POST /entries/validate/` (상신 전 검증 전용)

## 5.4 부서 승인함
- As-Is 사용 가능:
1. `POST /entries/{id}/approve/`
2. `POST /entries/{id}/reject/`
3. `POST /entries/workflow/` (부서/회차 일괄)
- To-Be 추가 권장:
1. `GET /entries/pending-approvals/?org_id=&year=&round=`

## 5.5 총무 검토/최종확정
- As-Is 사용 가능:
1. `POST /entries/{id}/approve/` (`REVIEWING -> FINALIZED`)
2. `POST /entries/{id}/reopen/`
3. `POST /entries/workflow/` (`approve`, `reopen`)
- To-Be 추가 권장:
1. `POST /finalizations/run/` (회차 단위 확정)
2. `GET /finalizations/checklist/?year=&round=`

## 5.6 확정 공지/배포
- As-Is 사용 가능:
1. `GET|POST /notifications/`
- To-Be 추가 권장:
1. `POST /announcements/`
2. `GET /announcements/`
3. `POST /announcements/{id}/publish/`
4. `GET /announcements/{id}/read-tracking/`

## 5.7 마감 현황
- As-Is 사용 가능:
1. `GET /entries/?year=&round=&org_id=`
2. `GET /logs/`
- To-Be 추가 권장:
1. `GET /closing/status/?year=&round=`
2. `POST /closing/complete/`
3. `POST /closing/reopen/`

## 5.8 보고서/Excel 출력
- As-Is 사용 가능:
1. 없음(ERP 동기화 제외)
- To-Be 추가 권장:
1. `GET /reports/summary.xlsx?year=&round=`
2. `GET /reports/department.xlsx?year=&round=&org_id=`
3. `GET /reports/delta.xlsx?year=&round=`
4. `GET /reports/audit.xlsx?year=&round=`
5. `GET /reports/jobs/{job_id}/` (비동기 생성 시)

## 5.9 사용자/권한 관리
- As-Is 사용 가능:
1. `GET|POST /auth/users/`
2. `PATCH|DELETE /auth/users/{user_id}/`
3. `POST /auth/assign-role/`
4. `GET /profiles/`
- To-Be 추가 권장:
1. `GET /auth/roles/` (역할/권한 매트릭스 조회)
2. `PATCH /auth/users/{user_id}/permissions/`

## 5.10 기준정보 관리
- As-Is 사용 가능:
1. `/orgs`, `/subjects`, `/entrusted-projects` CRUD
2. `/subjects/bulk-update-tree/`
- To-Be 추가 권장:
1. `GET /subjects/tree/?subject_type=income|expense`
2. `POST /subjects/clone-from-version/`

## 5.11 감사로그
- As-Is 사용 가능:
1. `GET /logs/`
- To-Be 추가 권장:
1. `GET /logs/export.xlsx?from=&to=&actor=&org_id=`
2. `GET /logs/stats/?from=&to=`

## 6. 핵심 API 요청/응답 예시

### 6.1 로그인
`POST /api/auth/login/`

```json
{
  "username": "manager01",
  "password": "********"
}
```

```json
{
  "token": "2dd0b5...",
  "user": {
    "id": 7,
    "username": "manager01",
    "name": "manager01",
    "email": "m@example.com"
  },
  "profile": {
    "role": "ADMIN",
    "organization": 3,
    "organization_name": "경영지원실"
  }
}
```

### 6.2 부서 일괄 상신
`POST /api/entries/workflow/`

```json
{
  "action": "submit",
  "org_id": 3,
  "year": 2026,
  "round": 0,
  "reason": "본예산 1차 상신"
}
```

```json
{
  "status": "ok",
  "action": "submit",
  "from_status": "DRAFT",
  "to_status": "PENDING",
  "updated_count": 128,
  "skipped_count": 2,
  "message": "128건 상신 처리 완료 (2건 제외)"
}
```

### 6.3 부서 승인(일괄)
`POST /api/entries/workflow/`

```json
{
  "action": "approve",
  "org_id": 3,
  "year": 2026,
  "round": 0
}
```

응답(예시):
- `PENDING -> REVIEWING` 또는 `REVIEWING -> FINALIZED`로 이동

### 6.4 세부 산출내역 생성
`POST /api/details/`

```json
{
  "entry": 1542,
  "name": "새 산출내역",
  "price": 1000000,
  "qty": 1,
  "freq": 1,
  "unit": "식",
  "currency_unit": "원",
  "freq_unit": "회",
  "source": "자체"
}
```

### 6.5 회차 생성
`POST /api/versions/create_next_round/`

```json
{
  "year": 2026
}
```

## 7. 권한 매핑 (초안)
| API 그룹 | REQUESTOR | REVIEWER | ADMIN |
|---|---|---|---|
| `/entries` 읽기 | O(소속) | O(소속) | O(전체) |
| `/entries` 쓰기 | O(소속, DRAFT만) | X | O |
| `/entries/*/submit` | O | X | O |
| `/entries/*/approve` | X | O(PENDING만) | O |
| `/entries/*/reject` | X | O(PENDING만) | O |
| `/entries/*/reopen` | X | X | O |
| `/versions/*` | 조회만 | 조회만 | O |
| `/auth/users/*` | X | X | O |
| `/logs/*` | 조회 제한 | 조회 제한 | O |

## 8. 구현 갭 및 우선순위

### 8.1 갭(현재 누락/보완 필요)
1. 대시보드 집계 전용 API 부재
2. 공지/배포(announcement) 도메인 부재
3. 마감 상태 관리 전용 API 부재
4. Excel 보고서 API 부재
5. 권한이 `AllowAny`인 ViewSet 다수 존재(보안 정합성 보완 필요)

### 8.2 우선순위 제안
1. Phase 1: 권한 보강 + 회차/상태 전이 안정화
2. Phase 2: 대시보드/마감/공지 API
3. Phase 3: Excel 보고서 + 비동기 생성(job) + 로그 통계

## 9. 다음 문서
1. `docs/db_spec_draft.md` (테이블/인덱스/제약/이력 모델)
2. `docs/api_examples.http` (실행 가능한 요청 샘플)
