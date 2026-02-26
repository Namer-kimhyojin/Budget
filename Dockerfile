# ── Stage 1: React 프론트엔드 빌드 ──────────────────────────────────
FROM node:20-slim AS frontend

WORKDIR /frontend
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Django 백엔드 ────────────────────────────────────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# 시스템 의존성
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성
COPY backend/requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# 백엔드 소스
COPY backend/ ./backend/

# 프론트 빌드 결과물 (backend와 같은 레벨에 dist/)
COPY --from=frontend /frontend/dist ./dist/

# 비루트 사용자
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

WORKDIR /app/backend

# DB 마이그레이션 + 정적파일 수집 후 서버 시작
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 ibms_backend.wsgi:application"]

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1
