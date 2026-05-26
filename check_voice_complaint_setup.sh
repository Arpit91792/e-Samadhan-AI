#!/bin/bash

# Voice Complaint Feature - Pre-Flight Checklist
# Verifies all components are properly configured

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Voice Complaint AI Feature - Pre-Flight Checklist             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper function
check() {
    local item="$1"
    local condition=$2
    
    if [ $condition -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $item"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $item"
        ((FAIL++))
    fi
}

# Check 1: Node.js installed
command -v node &> /dev/null
check "Node.js installed" $?

# Check 2: npm installed
command -v npm &> /dev/null
check "npm installed" $?

# Check 3: Backend folder exists
[ -d "backend" ] && [ -f "backend/server.js" ]
check "Backend server.js exists" $?

# Check 4: Backend .env exists
[ -f "backend/.env" ]
check "Backend .env exists" $?

# Check 5: GEMINI_API_KEY is set
grep -q "GEMINI_API_KEY" backend/.env
check "GEMINI_API_KEY configured in backend/.env" $?

# Check 6: Frontend VoiceComplaint component exists
[ -f "src/components/VoiceComplaint.jsx" ]
check "Frontend VoiceComplaint.jsx exists" $?

# Check 7: Frontend uses api client (not hardcoded URL)
grep -q 'import api from.*"../api/axios"' src/components/VoiceComplaint.jsx
check "Frontend imports api client (not axios)" $?

# Check 8: Frontend uses /api/voice-complaint endpoint
grep -q '"/ai/voice-complaint"' src/components/VoiceComplaint.jsx
check "Frontend uses /ai/voice-complaint endpoint" $?

# Check 9: Backend aiController exists
[ -f "backend/controllers/aiController.js" ]
check "Backend aiController.js exists" $?

# Check 10: Backend aiRoutes exists
[ -f "backend/routes/aiRoutes.js" ]
check "Backend aiRoutes.js exists" $?

# Check 11: Backend geminiService exists
[ -f "backend/services/geminiService.js" ]
check "Backend geminiService.js exists" $?

# Check 12: Vite config has /api proxy
grep -q "'/api'" vite.config.js && grep -q "http://localhost:5000" vite.config.js
check "Vite proxy configured for /api" $?

# Check 13: Package.json has google generative ai
grep -q "@google/generative-ai" backend/package.json
check "@google/generative-ai in backend dependencies" $?

# Check 14: Test scripts exist
[ -f "test_voice_complaint_ai.sh" ] || [ -f "test_voice_complaint_ai.bat" ]
check "Test scripts created" $?

# Check 15: Documentation exists
[ -f "VOICE_COMPLAINT_GUIDE.md" ]
check "Complete documentation exists" $?

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Summary                                                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Your setup is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. cd backend && npm run dev                    (Start backend)"
    echo "  2. npm run dev                                  (Start frontend in new terminal)"
    echo "  3. Open http://localhost:5173 in your browser"
    echo "  4. Login and click the microphone icon"
    echo ""
    echo "Test it with:"
    echo "  - Linux/Mac: ./test_voice_complaint_ai.sh"
    echo "  - Windows:   test_voice_complaint_ai.bat"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. GEMINI_API_KEY not set:"
    echo "     → Add GEMINI_API_KEY to backend/.env"
    echo "  2. Files missing:"
    echo "     → Check if files were edited correctly"
    echo "  3. Dependencies missing:"
    echo "     → Run: cd backend && npm install"
    echo ""
    exit 1
fi
