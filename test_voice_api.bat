@echo off
REM 🎤 AI Voice Complaint System - API Testing Script (Windows)
REM This script tests all the voice complaint APIs

setlocal enabledelayedexpansion
set BASE_URL=http://localhost:5000
set API_PATH=/api/ai

echo.
echo ==================================
echo 🎙️  AI Voice Complaint API Tests (Windows)
echo ==================================
echo.

REM Test 1: Basic Complaint Analysis
echo TEST 1: Analyze Voice Complaint (English)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/voice-complaint" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"The streetlight near my house is broken for the last two weeks. Please fix it as soon as possible.\"}"
echo.
echo.

REM Test 2: Complaint in Hindi
echo TEST 2: Analyze Voice Complaint (Hindi)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/voice-complaint" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"गांव में बिजली का तार टूट गया है और लोग बिना बिजली के रह रहे हैं।\"}"
echo.
echo.

REM Test 3: Emergency Complaint
echo TEST 3: Analyze Emergency Complaint
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/voice-complaint" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"There is a fire in the building next to the school. People are trapped inside!\"}"
echo.
echo.

REM Test 4: Emergency Detection
echo TEST 4: Emergency Keyword Detection
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/detect-emergency" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"There is violence happening at the local market!\"}"
echo.
echo.

REM Test 5: Language Detection - Hindi
echo TEST 5: Detect Language (Hindi)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/detect-language" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"नमस्ते, मेरी गांव में बिजली की समस्या है।\"}"
echo.
echo.

REM Test 6: Language Detection - English
echo TEST 6: Detect Language (English)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/detect-language" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"Hello, I have a problem with water supply in my area.\"}"
echo.
echo.

REM Test 7: Translation Test
echo TEST 7: Translate English to Hindi
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/translate" ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"The road has large potholes that are dangerous for vehicles.\",\"targetLanguage\":\"hi\"}"
echo.
echo.

REM Test 8: Translation Test - Tamil
echo TEST 8: Translate English to Tamil
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/translate" ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Garbage is not being collected from our street.\",\"targetLanguage\":\"ta\"}"
echo.
echo.

REM Test 9: Different Department Detection
echo TEST 9: Complaint Analysis - Different Departments
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/voice-complaint" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"बीमार बच्चे को स्वास्थ्य केंद्र में भर्ती किया जाना है।\"}"
echo.
echo.

REM Test 10: Complex complaint
echo TEST 10: Complex Multi-part Complaint
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
curl -X POST "%BASE_URL%%API_PATH%/voice-complaint" ^
  -H "Content-Type: application/json" ^
  -d "{\"complaintText\":\"Water pipe broke near the school and there is water flooding everywhere.\"}"
echo.
echo.

echo ==================================
echo ✅ All tests completed!
echo ==================================
echo.
echo Copy and paste the curl commands above into PowerShell if needed.
echo.
pause
