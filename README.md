# Budget Management System (IBMS)

예산 관리 시스템입니다. Django REST Framework + React + Vite 스택으로 구성되어 있습니다.

## 📋 목차

- [환경 설정](#환경-설정)
- [로컬 개발](#로컬-개발)
- [Docker로 실행](#docker로-실행)
- [프로젝트 구조](#프로젝트-구조)

## 환경 설정

### 사전 요구사항

- Python 3.11+ (로컬 개발)
- Node.js 20+ (프론트엔드)
- Docker & Docker Compose (선택사항)
- PostgreSQL 16+ (선택사항, 기본은 SQLite)

### 1단계: 환경 변수 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하세요:

```bash
cp .env.example .env
```

`.env` 파일에서 필요한 환경 변수를 설정하세요:

```env
# 필수
SECRET_KEY=your-secret-key-here
DEBUG=False  # 프로덕션에서는 False로 설정
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# ERPNext 연동 (선택)
ERPNEXT_BASE_URL=https://your-erpnext.com
ERPNEXT_API_KEY=your-key
ERPNEXT_API_SECRET=your-secret
```

## 로컬 개발

### 백엔드 설정

#### PowerShell 스크립트 사용 (Windows)

```powershell
# 1. 가상환경 생성 및 의존성 설치
cd backend/scripts
.\venv.ps1

# 또는 activate.ps1로 수동 활성화
.\activate.ps1
pip install -r ../requirements.txt

# 2. 데이터베이스 마이그레이션
python manage.py migrate

# 3. 개발 서버 실행
.\runserver.ps1
```

#### bash/터미널 사용 (macOS/Linux)

```bash
cd backend

# 1. 가상환경 생성
python3 -m venv .venv
source .venv/bin/activate

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 마이그레이션
python manage.py migrate

# 4. 서버 실행
python manage.py runserver 0.0.0.0:8000
```

### 프론트엔드 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 5173)
npm run dev
```

## Docker로 실행

### 전체 스택 시작

```bash
# .env 파일 확인
cp .env.example .env

# 서비스 시작 (백엔드, 프론트엔드, PostgreSQL)
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 서비스 종료
docker-compose down
```

### 개별 서비스 관리

```bash
# 백엔드만 실행
docker-compose up -d backend

# 마이그레이션 실행
docker-compose exec backend python manage.py migrate

# 관리자 계정 생성
docker-compose exec backend python manage.py createsuperuser

# 데이터베이스 접근
docker-compose exec db psql -U budget_user -d budget_db
```

## 프로젝트 구조

```
budget/
├── backend/                    # Django 백엔드
│   ├── budget_mgmt/           # 메인 앱
│   ├── ibms_backend/          # Django 설정
│   ├── scripts/               # PowerShell 헬퍼 스크립트
│   ├── manage.py
│   ├── requirements.txt        # Python 의존성
│   └── Dockerfile
├── src/                        # React 프론트엔드
│   ├── components/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
├── docker-compose.yml         # Docker Compose 설정
├── .env.example               # 환경 변수 템플릿
└── README.md

```

## 주요 명령어

### 백엔드

```bash
# 마이그레이션 생성
python manage.py makemigrations

# 마이그레이션 적용
python manage.py migrate

# 관리자 계정 생성
python manage.py createsuperuser

# 데이터 샘드 로드
python manage.py seed_data

# 셸 접근
python manage.py shell
```

### 프론트엔드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 실행
npm run lint
```

## 문제 해결

### 포트 이미 사용 중

```bash
# Windows - 포트 8000 사용 중인 프로세스 확인
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000
```

### 가상환경 문제

```bash
# 가상환경 재생성
rm -rf backend/.venv
python -m venv backend/.venv
source backend/.venv/bin/activate  # bash
# 또는
.\backend\.venv\Scripts\Activate.ps1  # PowerShell
```

### 데이터베이스 에러

```bash
# 마이그레이션 재설정
python manage.py migrate budget_mgmt zero   # 역마이그레이션
python manage.py migrate                     # 다시 마이그레이션
```

## 개발가이드

- [Backend API 문서](docs/api.md)
- [Database 스키마](docs/database.md)
- [배포 가이드](docs/deployment.md)

## 라이선스

MIT
