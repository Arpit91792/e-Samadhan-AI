@echo off
REM Voice Complaint AI Feature - Integration Test Script (Windows)
REM Tests the complete voice complaint flow with Gemini AI

setlocal enabledelayedexpansion

set API_URL=http://localhost:5000/api
set PASSED=0
set FAILED=0

echo.
echo =====================================================================
echo   Voice Complaint AI Feature - Integration Test
echo =====================================================================
echo.

REM Test 1: Check health
echo Testing: API Health Check
echo.
curl -s -X GET "%API_URL%/health" | findstr /C:"success" >nul
if !errorlevel! equ 0 (
    echo [PASS] API is responding
    set /a PASSED+=1
) else (
    echo [FAIL] API health check failed
    set /a FAILED+=1
)
echo.

REM Test 2: English complaint
echo Testing: English Complaint Analysis
set "ENGLISH_DATA={"complaintText":"The water supply in our colony has been disconnected for 5 days. We need immediate action to restore it."}"
curl -s -X POST "%API_URL%/ai/voice-complaint" ^
    -H "Content-Type: application/json" ^
    -d "%ENGLISH_DATA%" | findstr /C:"success" >nul
if !errorlevel! equ 0 (
    echo [PASS] English complaint analyzed
    set /a PASSED+=1
) else (
    echo [FAIL] English complaint analysis failed
    set /a FAILED+=1
)
echo.

REM Test 3: Hindi complaint
echo Testing: Hindi Complaint Analysis
set "HINDI_DATA={"complaintText":"हमारे एरिया में कल दो लोगों ने घुसकर घर पर सोना चुराया"}"
curl -s -X POST "%API_URL%/ai/voice-complaint" ^
    -H "Content-Type: application/json" ^
    -d "%HINDI_DATA%" | findstr /C:"success" >nul
if !errorlevel! equ 0 (
    echo [PASS] Hindi complaint analyzed
    set /a PASSED+=1
) else (
    echo [FAIL] Hindi complaint analysis failed
    set /a FAILED+=1
)
echo.

REM Test 4: Emergency complaint
echo Testing: Emergency Complaint Detection
set "EMERGENCY_DATA={"complaintText":"There is a fire in the residential building. People are trapped on the third floor."}"
curl -s -X POST "%API_URL%/ai/voice-complaint" ^
    -H "Content-Type: application/json" ^
    -d "%EMERGENCY_DATA%" | findstr /C:"emergency" >nul
if !errorlevel! equ 0 (
    echo [PASS] Emergency detected
    set /a PASSED+=1
) else (
    echo [FAIL] Emergency detection failed
    set /a FAILED+=1
)
echo.

REM Summary
echo =====================================================================
echo   Test Results Summary
echo =====================================================================
echo Passed: !PASSED!
echo Failed: !FAILED!
echo.

if !FAILED! equ 0 (
    echo [SUCCESS] All tests passed!
    echo.
    echo Your voice complaint AI feature is working correctly!
    echo.
    echo Next steps:
    echo 1. Open http://localhost:5173 in your browser
    echo 2. Login as a citizen
    echo 3. Click the microphone icon to file a voice complaint
    echo 4. Speak your complaint in English or Hindi
    echo 5. The AI will analyze it and suggest priority/department
    exit /b 0
) else (
    echo [FAILURE] Some tests failed!
    echo.
    echo Troubleshooting:
    echo 1. Check backend is running: npm run dev (in backend/ folder)
    echo 2. Check GEMINI_API_KEY is set in backend/.env
    echo 3. Check network connectivity
    echo 4. Review backend logs for errors
    exit /b 1
)
