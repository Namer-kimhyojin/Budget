@echo off
REM Budget Management System - Setup Script
REM 초기 설정: 가상환경 생성 및 의존성 설치

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ========================================
echo Budget Management System Setup
echo ========================================
echo.

REM .env 파일 확인
if not exist .env (
    echo [INFO] .env 파일이 없습니다. .env.example에서 복사합니다...
    if exist .env.example (
        copy .env.example .env
        echo [OK] .env 파일이 생성되었습니다. 필요에 따라 설정을 변경하세요.
    ) else (
        echo [ERROR] .env.example 파일을 찾을 수 없습니다.
        exit /b 1
    )
)

REM 백엔드 가상환경 설정
echo.
echo [1/4] 백엔드 가상환경 설정 중...
if not exist backend\.venv (
    echo [INFO] 가상환경 생성 중...
    cd backend
    py -3 -m venv .venv
    if errorlevel 1 (
        echo [ERROR] 가상환경 생성 실패
        exit /b 1
    )
    cd ..
) else (
    echo [OK] 가상환경이 이미 존재합니다.
)

REM 백엔드 의존성 설치
echo [2/4] 백엔드 의존성 설치 중...
call backend\.venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] 가상환경 활성화 실패
    exit /b 1
)

pip install --upgrade pip setuptools wheel >nul 2>&1
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] 의존성 설치 실패
    exit /b 1
)
echo [OK] 백엔드 의존성 설치 완료

REM 프론트엔드 의존성 설치
echo [3/4] 프론트엔드 의존성 설치 중...
if exist package.json (
    if not exist node_modules (
        call npm install
        if errorlevel 1 (
            echo [WARNING] npm 설치 실패. npm이 설치되어 있는지 확인하세요.
        ) else (
            echo [OK] 프론트엔드 의존성 설치 완료
        )
    ) else (
        echo [OK] node_modules가 이미 존재합니다.
    )
) else (
    echo [WARNING] package.json을 찾을 수 없습니다.
)

REM 데이터베이스 마이그레이션
echo [4/4] 데이터베이스 마이그레이션 중...
cd backend
python manage.py migrate
if errorlevel 1 (
    echo [WARNING] 마이그레이션 중 오류가 발생했습니다.
) else (
    echo [OK] 마이그레이션 완료
)
cd ..

echo.
echo ========================================
echo 설정 완료!
echo ========================================
echo.
echo 다음 명령어로 서버를 실행하세요:
echo   - 백엔드: run-backend.bat
echo   - 프론트엔드: run-frontend.bat
echo   - 전체: run-all.bat
echo   - Docker: run-docker.bat
echo.
echo 또는 수동 실행:
echo   - 백엔드: backend\.venv\Scripts\activate.bat ^&^& cd backend ^&^ python manage.py runserver 0.0.0.0:8000
echo   - 프론트엔드: npm run dev
echo.
pause
