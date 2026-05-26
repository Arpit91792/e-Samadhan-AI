#!/bin/bash

# Voice Complaint AI Feature - Integration Test Script
# Tests the complete voice complaint flow with Gemini AI

API_URL="http://localhost:5000/api"
TIMESTAMP=$(date +%s)

echo ""
echo "═════════════════════════════════════════════════════════════"
echo "  Voice Complaint AI Feature - Integration Test"
echo "═════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -e "${BLUE}Testing:${NC} $description"
    echo -e "  Endpoint: ${YELLOW}$method $endpoint${NC}"
    
    if [ ! -z "$data" ]; then
        echo -e "  Data: $data"
    fi

    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X GET "$API_URL$endpoint")
    fi

    # Check if response contains "success"
    if echo "$response" | grep -q "\"success\""; then
        if echo "$response" | grep -q "\"success\":true"; then
            echo -e "  ${GREEN}✅ PASSED${NC}"
            ((PASSED++))
        else
            echo -e "  ${RED}❌ FAILED${NC}"
            echo -e "  Response: $response"
            ((FAILED++))
        fi
    else
        echo -e "  ${RED}❌ FAILED${NC} (No success field)"
        echo -e "  Response: $response"
        ((FAILED++))
    fi
    echo ""
}

# Test 1: Check health
echo -e "${YELLOW}═══ Test Suite 1: API Health ${NC}"
test_endpoint "GET" "/health" "" "API Health Check"

# Test 2: English complaint
echo -e "${YELLOW}═══ Test Suite 2: English Voice Complaint ${NC}"
english_complaint='{"complaintText":"The water supply in our colony has been disconnected for 5 days. We need immediate action to restore it."}'
test_endpoint "POST" "/ai/voice-complaint" "$english_complaint" "English Complaint Analysis"

# Test 3: Hindi complaint (important for the requirement)
echo -e "${YELLOW}═══ Test Suite 3: Hindi Voice Complaint ${NC}"
hindi_complaint='{"complaintText":"हमारे एरिया में कल दो लोगों ने घुसकर घर पर सोना चुराया"}'
test_endpoint "POST" "/ai/voice-complaint" "$hindi_complaint" "Hindi Complaint Analysis"

# Test 4: Emergency complaint
echo -e "${YELLOW}═══ Test Suite 4: Emergency Voice Complaint ${NC}"
emergency_complaint='{"complaintText":"There is a fire in the residential building. People are trapped on the third floor."}'
test_endpoint "POST" "/ai/voice-complaint" "$emergency_complaint" "Emergency Complaint Analysis"

# Test 5: Empty complaint (should fail)
echo -e "${YELLOW}═══ Test Suite 5: Invalid Input Handling ${NC}"
empty_complaint='{"complaintText":""}'
test_endpoint "POST" "/ai/voice-complaint" "$empty_complaint" "Empty Complaint (should fail)"

# Test 6: Language detection
echo -e "${YELLOW}═══ Test Suite 6: Language Detection ${NC}"
lang_test='{"complaintText":"बिजली बिल में गड़बड़ी है"}'
test_endpoint "POST" "/ai/detect-language" "$lang_test" "Language Detection"

# Test 7: Emergency detection
echo -e "${YELLOW}═══ Test Suite 7: Emergency Keywords Detection ${NC}"
emergency_keywords='{"complaintText":"There is violence and robbery happening near my house"}'
test_endpoint "POST" "/ai/detect-emergency" "$emergency_keywords" "Emergency Keywords Detection"

# Summary
echo ""
echo "═════════════════════════════════════════════════════════════"
echo -e "  Test Results Summary"
echo "═════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Your voice complaint AI feature is working correctly!"
    echo ""
    echo "Next steps:"
    echo "1. Open http://localhost:5173 in your browser"
    echo "2. Login as a citizen"
    echo "3. Click the microphone icon to file a voice complaint"
    echo "4. Speak your complaint in English or Hindi"
    echo "5. The AI will analyze it and suggest priority/department"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check backend is running: npm run dev (in backend/ folder)"
    echo "2. Check GEMINI_API_KEY is set in backend/.env"
    echo "3. Check network connectivity"
    echo "4. Review backend logs for errors"
    exit 1
fi
