@echo off
REM Budget Management System - Port Killer
REM 충돌하는 포트를 강제로 해제합니다.

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ========================================
echo Port Conflict Resolver
echo ========================================
echo.

REM 포트 목록
echo [1] 포트 5173 (Vite)
echo [2] 포트 8000 (Django)
echo [3] 포트 5432 (PostgreSQL)
echo [4] 모든 포트 정리
echo [5] 취소
echo.

set /p choice="선택: "

if "%choice%"=="1" (
    call :kill_port 5173 "Vite Frontend"
) else if "%choice%"=="2" (
    call :kill_port 8000 "Django Backend"
) else if "%choice%"=="3" (
    call :kill_port 5432 "PostgreSQL"
) else if "%choice%"=="4" (
    call :kill_port 5173 "Vite Frontend"
    call :kill_port 8000 "Django Backend"
    call :kill_port 5432 "PostgreSQL"
) else if "%choice%"=="5" (
    exit /b 0
) else (
    echo [ERROR] 잘못된 선택입니다.
    exit /b 1
)

goto end

:kill_port
setlocal
set port=%~1
set name=%~2

echo.
echo 포트 %port% (%name%) 확인 중...

for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :%port%') do (
    echo [INFO] 프로세스 ID: %%a
    echo [INFO] 프로세스 정보:
    tasklist 2>nul | findstr "%%a"
    
    echo.
    set /p confirm="이 프로세스를 종료하시겠습니까? (y/n): "
    if /i "!confirm!"=="y" (
        taskkill /PID %%a /F
        if errorlevel 1 (
            echo [ERROR] 프로세스 종료 실패
        ) else (
            echo [OK] 프로세스 종료됨
            timeout /t 1 /nobreak
        )
    )
)

endlocal
exit /b 0

:end
echo.
echo ========================================
echo 완료 - 다시 서버를 시작하세요
echo ========================================
echo.
pause
