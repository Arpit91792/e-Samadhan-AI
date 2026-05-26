@echo off
REM Voice Complaint Feature - Pre-Flight Checklist (Windows)
REM Verifies all components are properly configured

setlocal enabledelayedexpansion

set PASS=0
set FAIL=0

echo.
echo ======================================================================
echo   Voice Complaint AI Feature - Pre-Flight Checklist
echo ======================================================================
echo.

REM Check 1: Node.js installed
where node >nul 2>nul
if !errorlevel! equ 0 (
    echo [PASS] Node.js installed
    set /a PASS+=1
) else (
    echo [FAIL] Node.js installed
    set /a FAIL+=1
)

REM Check 2: npm installed
where npm >nul 2>nul
if !errorlevel! equ 0 (
    echo [PASS] npm installed
    set /a PASS+=1
) else (
    echo [FAIL] npm installed
    set /a FAIL+=1
)

REM Check 3: Backend folder exists
if exist "backend\server.js" (
    echo [PASS] Backend server.js exists
    set /a PASS+=1
) else (
    echo [FAIL] Backend server.js exists
    set /a FAIL+=1
)

REM Check 4: Backend .env exists
if exist "backend\.env" (
    echo [PASS] Backend .env exists
    set /a PASS+=1
) else (
    echo [FAIL] Backend .env exists
    set /a FAIL+=1
)

REM Check 5: GEMINI_API_KEY is set
findstr /I "GEMINI_API_KEY" backend\.env >nul 2>nul
if !errorlevel! equ 0 (
    echo [PASS] GEMINI_API_KEY configured in backend\.env
    set /a PASS+=1
) else (
    echo [FAIL] GEMINI_API_KEY configured in backend\.env
    set /a FAIL+=1
)

REM Check 6: Frontend VoiceComplaint component exists
if exist "src\components\VoiceComplaint.jsx" (
    echo [PASS] Frontend VoiceComplaint.jsx exists
    set /a PASS+=1
) else (
    echo [FAIL] Frontend VoiceComplaint.jsx exists
    set /a FAIL+=1
)

REM Check 7: Frontend uses api client
findstr /I "import api from" src\components\VoiceComplaint.jsx >nul 2>nul
if !errorlevel! equ 0 (
    echo [PASS] Frontend imports api client
    set /a PASS+=1
) else (
    echo [FAIL] Frontend imports api client
    set /a FAIL+=1
)

REM Check 8: Frontend uses /api/voice-complaint endpoint
findstr /I "/ai/voice-complaint" src\components\VoiceComplaint.jsx >nul 2>nul
if !errorlevel! equ 0 (
    echo [PASS] Frontend uses /ai/voice-complaint endpoint
    set /a PASS+=1
) else (
    echo [FAIL] Frontend uses /ai/voice-complaint endpoint
    set /a FAIL+=1
)

REM Check 9: Backend aiController exists
if exist "backend\controllers\aiController.js" (
    echo [PASS] Backend aiController.js exists
    set /a PASS+=1
) else (
    echo [FAIL] Backend aiController.js exists
    set /a FAIL+=1
)

REM Check 10: Backend aiRoutes exists
if exist "backend\routes\aiRoutes.js" (
    echo [PASS] Backend aiRoutes.js exists
    set /a PASS+=1
) else (
    echo [FAIL] Backend aiRoutes.js exists
    set /a FAIL+=1
)

REM Check 11: Backend geminiService exists
if exist "backend\services\geminiService.js" (
    echo [PASS] Backend geminiService.js exists
    set /a PASS+=1
) else (
    echo [FAIL] Backend geminiService.js exists
    set /a FAIL+=1
)

REM Check 12: Vite config exists
if exist "vite.config.js" (
    findstr /I "/api" vite.config.js >nul 2>nul
    if !errorlevel! equ 0 (
        echo [PASS] Vite proxy configured for /api
        set /a PASS+=1
    ) else (
        echo [FAIL] Vite proxy configured for /api
        set /a FAIL+=1
    )
) else (
    echo [FAIL] vite.config.js not found
    set /a FAIL+=1
)

REM Check 13: Package.json has google generative ai
findstr /I "@google/generative-ai" backend\package.json >nul 2>nul
if !errorlevel! equ 0 (
    echo [PASS] @google/generative-ai in dependencies
    set /a PASS+=1
) else (
    echo [FAIL] @google/generative-ai in dependencies
    set /a FAIL+=1
)

REM Check 14: Test scripts exist
if exist "test_voice_complaint_ai.bat" (
    echo [PASS] Test scripts created
    set /a PASS+=1
) else (
    echo [FAIL] Test scripts created
    set /a FAIL+=1
)

REM Check 15: Documentation exists
if exist "VOICE_COMPLAINT_GUIDE.md" (
    echo [PASS] Documentation exists
    set /a PASS+=1
) else (
    echo [FAIL] Documentation exists
    set /a FAIL+=1
)

echo.
echo ======================================================================
echo   Summary
echo ======================================================================
echo Passed: !PASS!
echo Failed: !FAIL!
echo.

if !FAIL! equ 0 (
    echo [SUCCESS] All checks passed! Your setup is ready.
    echo.
    echo Next steps:
    echo   1. cd backend ^&^& npm run dev                 [Start backend]
    echo   2. npm run dev                               [Start frontend - new terminal]
    echo   3. Open http://localhost:5173 in browser
    echo   4. Login and click the microphone icon
    echo.
    echo Test it with: test_voice_complaint_ai.bat
    exit /b 0
) else (
    echo [FAILURE] Some checks failed. Please fix the issues above.
    echo.
    echo Common fixes:
    echo   1. GEMINI_API_KEY not set:
    echo      ^- Add GEMINI_API_KEY to backend\.env
    echo   2. Files missing:
    echo      ^- Check if files were edited correctly
    echo   3. Dependencies missing:
    echo      ^- Run: cd backend ^&^& npm install
    echo.
    exit /b 1
)
