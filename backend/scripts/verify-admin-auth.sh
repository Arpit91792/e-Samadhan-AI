#!/bin/bash

# Admin Authentication Verification Script
# This script tests the complete admin authentication flow

API_BASE_URL="${1:-http://localhost:5000/api}"
ADMIN_EMAIL="${2:-admin@demo.com}"
ADMIN_PASSWORD="${3:-Demo@1234}"
ADMIN_DEPT="${4:-police}"

echo "================================"
echo "Admin Authentication Test Suite"
echo "================================"
echo "API Base URL: $API_BASE_URL"
echo "Admin Email: $ADMIN_EMAIL"
echo "Department: $ADMIN_DEPT"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for tests
PASSED=0
FAILED=0

# Function to print test result
print_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} PASS: $test_name"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} FAIL: $test_name"
        if [ -n "$details" ]; then
            echo "  $details"
        fi
        ((FAILED++))
    fi
}

# Test 1: Login API
echo -e "\n${YELLOW}Test 1: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'$ADMIN_EMAIL'",
        "password": "'$ADMIN_PASSWORD'",
        "department": "'$ADMIN_DEPT'"
    }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
ADMIN_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
ADMIN_DEPT_RESPONSE=$(echo "$LOGIN_RESPONSE" | grep -o '"department":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "Token: ${TOKEN:0:30}..."
    print_test "Login returns token" 0
else
    echo "Response: $LOGIN_RESPONSE"
    print_test "Login returns token" 1 "No token in response"
fi

if [ -n "$ADMIN_ID" ]; then
    echo "Admin ID: $ADMIN_ID"
    print_test "Login returns admin ID" 0
else
    print_test "Login returns admin ID" 1 "No admin ID in response"
fi

if [ "$ADMIN_DEPT_RESPONSE" == "$ADMIN_DEPT" ]; then
    print_test "Login returns correct department" 0
else
    print_test "Login returns correct department" 1 "Expected $ADMIN_DEPT, got $ADMIN_DEPT_RESPONSE"
fi

# Test 2: Session Check
if [ -n "$TOKEN" ]; then
    echo -e "\n${YELLOW}Test 2: Admin Session Check${NC}"
    SESSION_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/session-check" \
        -H "Authorization: Bearer $TOKEN")
    
    SESSION_ADMIN_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ "$SESSION_ADMIN_ID" == "$ADMIN_ID" ]; then
        print_test "Session check returns correct admin ID" 0
    else
        print_test "Session check returns correct admin ID" 1 "Expected $ADMIN_ID, got $SESSION_ADMIN_ID"
        echo "Response: $SESSION_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Test 2: Admin Session Check (SKIPPED)${NC}"
    echo "Skipped due to missing token from login test"
fi

# Test 3: Get Officers
if [ -n "$TOKEN" ]; then
    echo -e "\n${YELLOW}Test 3: Get Officers List${NC}"
    OFFICERS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/officers" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$OFFICERS_RESPONSE" | grep -q '"success":true'; then
        print_test "Get officers API returns success" 0
        OFFICER_COUNT=$(echo "$OFFICERS_RESPONSE" | grep -o '"name":"[^"]*' | wc -l)
        echo "Officers found: $OFFICER_COUNT"
    else
        print_test "Get officers API returns success" 1
        echo "Response: $OFFICERS_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Test 3: Get Officers (SKIPPED)${NC}"
    echo "Skipped due to missing token from login test"
fi

# Test 4: Create Officer
if [ -n "$TOKEN" ]; then
    echo -e "\n${YELLOW}Test 4: Create Officer${NC}"
    OFFICER_EMAIL="test-officer-$(date +%s)@example.com"
    CREATE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/create-officer" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Officer",
            "email": "'$OFFICER_EMAIL'",
            "mobile": "9876543210"
        }')
    
    if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
        print_test "Create officer API returns success" 0
        OFFICER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
        echo "Created officer ID: $OFFICER_ID"
    else
        print_test "Create officer API returns success" 1
        echo "Response: $CREATE_RESPONSE"
    fi
else
    echo -e "\n${YELLOW}Test 4: Create Officer (SKIPPED)${NC}"
    echo "Skipped due to missing token from login test"
fi

# Test 5: Invalid Token
echo -e "\n${YELLOW}Test 5: Invalid Token Handling${NC}"
INVALID_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/session-check" \
    -H "Authorization: Bearer invalid.token.here")

if echo "$INVALID_RESPONSE" | grep -q '"success":false'; then
    print_test "Invalid token returns error" 0
else
    print_test "Invalid token returns error" 1
    echo "Response: $INVALID_RESPONSE"
fi

# Test 6: Missing Token
echo -e "\n${YELLOW}Test 6: Missing Token Handling${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/session-check")

if echo "$NO_TOKEN_RESPONSE" | grep -q '"success":false'; then
    print_test "Missing token returns 401" 0
else
    print_test "Missing token returns 401" 1
    echo "Response: $NO_TOKEN_RESPONSE"
fi

# Summary
echo -e "\n================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
