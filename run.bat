@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "WEB_DIR=%ROOT_DIR%web"

if not exist "%BACKEND_DIR%" (
  echo [ERROR] Missing backend directory: "%BACKEND_DIR%"
  exit /b 1
)

if not exist "%WEB_DIR%" (
  echo [ERROR] Missing web directory: "%WEB_DIR%"
  exit /b 1
)

if exist "%ROOT_DIR%stop.bat" (
  call "%ROOT_DIR%stop.bat" >nul 2>nul
)

call :load_env "%BACKEND_DIR%\.env.development"
if errorlevel 1 call :load_env "%BACKEND_DIR%\.env.development.example"
call :load_env "%WEB_DIR%\.env.development"
if errorlevel 1 call :load_env "%WEB_DIR%\.env.development.example"

if not defined APP_HOST set "APP_HOST=127.0.0.1"
if not defined APP_PORT set "APP_PORT=9111"
if not defined APP_ENV set "APP_ENV=development"
if not defined APP_TIMEZONE set "APP_TIMEZONE=Asia/Ho_Chi_Minh"
if not defined VITE_API_BASE_URL set "VITE_API_BASE_URL=http://127.0.0.1:9111/api"

echo Starting backend on http://%APP_HOST%:%APP_PORT%
start "LeoNote Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && python -m alembic upgrade head && python -m uvicorn app.main:app --app-dir ""%BACKEND_DIR%"" --host %APP_HOST% --port %APP_PORT% --reload"

echo Starting frontend on http://127.0.0.1:9110
start "LeoNote Frontend" cmd /k "cd /d ""%WEB_DIR%"" && npm.cmd run dev"

echo.
echo LeoNote dev servers started:
echo   Backend:  http://%APP_HOST%:%APP_PORT%
echo   Frontend: http://127.0.0.1:9110
exit /b 0

:load_env
set "ENV_FILE=%~1"
if not exist "%ENV_FILE%" exit /b 1

for /f "usebackq tokens=* delims=" %%L in ("%ENV_FILE%") do (
  set "LINE=%%L"
  if defined LINE (
    if not "!LINE:~0,1!"=="#" (
      for /f "tokens=1,* delims==" %%A in ("!LINE!") do (
        if not "%%A"=="" set "%%A=%%B"
      )
    )
  )
)
exit /b 0
