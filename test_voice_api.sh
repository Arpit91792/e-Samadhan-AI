#!/bin/bash

# 🎤 AI Voice Complaint System - API Testing Script
# This script tests all the voice complaint APIs

BASE_URL="http://localhost:5000"
API_PATH="/api/ai"

echo "=================================="
echo "🎙️  AI Voice Complaint API Tests"
echo "=================================="
echo ""

# Test 1: Basic Complaint Analysis
echo "TEST 1: Analyze Voice Complaint (English)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/voice-complaint" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"The streetlight near my house is broken for the last two weeks. Please fix it as soon as possible."}' | jq .
echo ""
echo ""

# Test 2: Complaint in Hindi
echo "TEST 2: Analyze Voice Complaint (Hindi)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/voice-complaint" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"गांव में बिजली का तार टूट गया है और लोग बिना बिजली के रह रहे हैं। कृपया इसे तुरंत ठीक करें।"}' | jq .
echo ""
echo ""

# Test 3: Emergency Complaint
echo "TEST 3: Analyze Emergency Complaint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/voice-complaint" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"There is a fire in the building next to the school. People are trapped inside!"}' | jq .
echo ""
echo ""

# Test 4: Emergency Detection
echo "TEST 4: Emergency Keyword Detection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/detect-emergency" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"There is violence happening at the local market!"}' | jq .
echo ""
echo ""

# Test 5: Language Detection - Hindi
echo "TEST 5: Detect Language (Hindi)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/detect-language" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"नमस्ते, मेरी गांव में बिजली की समस्या है।"}' | jq .
echo ""
echo ""

# Test 6: Language Detection - English
echo "TEST 6: Detect Language (English)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/detect-language" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"Hello, I have a problem with water supply in my area."}' | jq .
echo ""
echo ""

# Test 7: Translation Test
echo "TEST 7: Translate English to Hindi"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"The road has large potholes that are dangerous for vehicles.","targetLanguage":"hi"}' | jq .
echo ""
echo ""

# Test 8: Translation Test - Tamil
echo "TEST 8: Translate English to Tamil"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/translate" \
  -H "Content-Type: application/json" \
  -d '{"text":"Garbage is not being collected from our street.","targetLanguage":"ta"}' | jq .
echo ""
echo ""

# Test 9: Different Department Detection
echo "TEST 9: Complaint Analysis - Different Departments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/voice-complaint" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"बीमार बच्चे को स्वास्थ्य केंद्र में भर्ती किया जाना है लेकिन सड़क खराब है।"}' | jq .
echo ""
echo ""

# Test 10: Multi-language complaint
echo "TEST 10: Complex Multi-part Complaint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE_URL}${API_PATH}/voice-complaint" \
  -H "Content-Type: application/json" \
  -d '{"complaintText":"Water pipe broke near the school and there is water flooding everywhere. The school is closed and children cannot attend classes. Please send someone immediately to fix it."}' | jq .
echo ""
echo ""

echo "=================================="
echo "✅ All tests completed!"
echo "=================================="
echo ""
echo "To see JSON output, ensure 'jq' is installed."
echo "If 'jq' is not available, remove '| jq .' from any command"
echo ""
