@echo off
chcp 65001 >nul
TITLE Budget Management System - Integrated Server
REM 통합된 Django 서버 하나만 실행합니다 (Port 8000)

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo   Budget Management System - Integrated Mode
echo ============================================================
echo.

REM 1. 백엔드 가상환경 확인
@echo off
chcp 65001 >nul
TITLE Budget Management System - Integrated Server
REM 통합된 Django 서버 하나만 실행합니다 (Port 8000)

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo   Budget Management System - Integrated Mode
echo ============================================================
echo.

REM 1. 백엔드 가상환경 확인
if not exist backend\.venv (
    echo [ERROR] 백엔드 가상환경을 찾을 수 없습니다. setup.bat를 먼저 실행하세요.
    pause
    exit /b 1
)

echo.
echo [1/3] 프런트엔드 빌드 중... (npm run build)
echo.
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed. Server start aborted.
    pause
    exit /b 1
)

echo.
echo [2/3] DB migration check (python manage.py migrate)
echo.
call backend\.venv\Scripts\activate.bat && cd backend && python manage.py migrate
if errorlevel 1 (
    echo [ERROR] Migration failed. Server start aborted.
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] 통합 서버 시작 중... (Django Port 8000)
echo.
echo ------------------------------------------------------------
echo  접속 주소: http://localhost:8000
echo ------------------------------------------------------------
echo  - 프런트엔드와 백엔드가 하나의 서버에서 동작합니다.
echo  - 최근 변경된 코드가 반영된 프런트엔드 빌드(dist)를 사용합니다.
echo  - 포트 8000번만 사용합니다.
echo ------------------------------------------------------------
echo  서버를 종료하려면 이 창에서 Ctrl+C를 누르세요.
echo ------------------------------------------------------------
echo.

REM 백엔드 가상환경 활성화 및 실행
cd backend
call .venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000

pause
