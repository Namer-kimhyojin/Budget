@echo off
chcp 65001 >nul
TITLE Budget Management System - Development Server
REM 프런트엔드(Vite)와 백엔드(Django) 개발 서버를 동시에 실행합니다.

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo   Budget Management System - Development Mode
echo ============================================================
echo.
echo 백엔드(Django)와 프런트엔드(Vite) 개발 서버를 동시에 실행합니다.
echo - 프런트엔드 접속 주소: http://localhost:5173 (수정사항 즉시 반영 됨)
echo - 백엔드 API 서버: http://localhost:8000
echo.
echo ============================================================
echo.

REM 1. 백엔드 가상환경 확인
if not exist backend\.venv (
    echo [ERROR] 백엔드 가상환경을 찾을 수 없습니다. setup.bat를 먼저 실행하세요.
    pause
    exit /b 1
)

echo.
echo [1/2] 백엔드(Django) 서버를 새 창에서 실행합니다...
start "Django Backend Server" cmd /k "cd backend && call .venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"

echo.
echo [2/2] 프런트엔드(Vite) 서버를 3초 뒤 이 창에서 실행합니다...
REM 잠시 대기 (백엔드 서버 구동 시간 확보)
timeout /t 3 >nul

echo.
echo 프런트엔드 서버 시작! (브라우저로 http://localhost:5173 접속)
echo.
call npm run dev

pause
