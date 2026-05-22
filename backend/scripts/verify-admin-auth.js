#!/usr/bin/env node

/**
 * Admin Authentication Verification Script (Node.js)
 * Tests the complete admin authentication flow
 * 
 * Usage:
 *   node verify-admin-auth.js [apiBaseUrl] [adminEmail] [adminPassword] [adminDept]
 * 
 * Example:
 *   node verify-admin-auth.js http://localhost:5000/api admin@demo.com Demo@1234 police
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const API_BASE_URL = process.argv[2] || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.argv[3] || 'admin@demo.com';
const ADMIN_PASSWORD = process.argv[4] || 'Demo@1234';
const ADMIN_DEPT = process.argv[5] || 'police';

// Colors for terminal output
const colors = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      cyan: '\x1b[36m',
};

// Test tracking
let passed = 0;
let failed = 0;

console.log('\n================================');
console.log('Admin Authentication Test Suite');
console.log('================================');
console.log(`API Base URL: ${API_BASE_URL}`);
console.log(`Admin Email: ${ADMIN_EMAIL}`);
console.log(`Department: ${ADMIN_DEPT}`);
console.log('');

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
      return new Promise((resolve, reject) => {
            const fullUrl = `${API_BASE_URL}${path}`;
            const parsedUrl = new url.URL(fullUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;

            const options = {
                  hostname: parsedUrl.hostname,
                  port: parsedUrl.port,
                  path: parsedUrl.pathname + parsedUrl.search,
                  method: method,
                  headers: {
                        'Content-Type': 'application/json',
                        ...headers,
                  },
            };

            const req = client.request(options, (res) => {
                  let data = '';
                  res.on('data', chunk => data += chunk);
                  res.on('end', () => {
                        try {
                              const json = JSON.parse(data);
                              resolve({ status: res.statusCode, headers: res.headers, body: json });
                        } catch (e) {
                              resolve({ status: res.statusCode, headers: res.headers, body: data });
                        }
                  });
            });

            req.on('error', reject);

            if (body) {
                  req.write(JSON.stringify(body));
            }

            req.end();
      });
}

// Helper function to print test results
function printTest(testName, passed, details = '') {
      if (passed) {
            console.log(`${colors.green}✓${colors.reset} PASS: ${testName}`);
            global.passed++;
      } else {
            console.log(`${colors.red}✗${colors.reset} FAIL: ${testName}`);
            if (details) {
                  console.log(`  ${details}`);
            }
            global.failed++;
      }
}

// Test suite
async function runTests() {
      let token = null;
      let adminId = null;
      let adminDeptResponse = null;

      // Test 1: Admin Login
      console.log(`\n${colors.yellow}Test 1: Admin Login${colors.reset}`);
      try {
            const loginResponse = await makeRequest('POST', '/admin/login', {
                  email: ADMIN_EMAIL,
                  password: ADMIN_PASSWORD,
                  department: ADMIN_DEPT,
            });

            if (loginResponse.status === 200 && loginResponse.body.token) {
                  token = loginResponse.body.token;
                  adminId = loginResponse.body.admin?.id || loginResponse.body.user?.id;
                  adminDeptResponse = loginResponse.body.admin?.department || loginResponse.body.user?.department || loginResponse.body.department;

                  console.log(`Token: ${token.substring(0, 30)}...`);
                  printTest('Login returns token', true);
                  printTest('Login returns admin ID', adminId ? true : false);
                  printTest('Login returns correct department', adminDeptResponse === ADMIN_DEPT,
                        `Expected ${ADMIN_DEPT}, got ${adminDeptResponse}`);
            } else {
                  printTest('Login returns token', false, `Status: ${loginResponse.status}`);
                  console.log('Response:', loginResponse.body);
            }
      } catch (error) {
            printTest('Login returns token', false, error.message);
      }

      // Test 2: Session Check
      if (token) {
            console.log(`\n${colors.yellow}Test 2: Admin Session Check${colors.reset}`);
            try {
                  const sessionResponse = await makeRequest('GET', '/admin/session-check', null, {
                        'Authorization': `Bearer ${token}`,
                  });

                  const sessionAdminId = sessionResponse.body.admin?.id || sessionResponse.body.admin?._id;
                  if (sessionResponse.status === 200 && sessionAdminId === adminId) {
                        printTest('Session check returns correct admin ID', true);
                  } else {
                        printTest('Session check returns correct admin ID', false,
                              `Expected ${adminId}, got ${sessionAdminId}`);
                        console.log('Response:', sessionResponse.body);
                  }
            } catch (error) {
                  printTest('Session check returns correct admin ID', false, error.message);
            }
      } else {
            console.log(`\n${colors.yellow}Test 2: Admin Session Check (SKIPPED)${colors.reset}`);
            console.log('Skipped due to missing token from login test');
      }

      // Test 3: Get Officers
      if (token) {
            console.log(`\n${colors.yellow}Test 3: Get Officers List${colors.reset}`);
            try {
                  const officersResponse = await makeRequest('GET', '/admin/officers', null, {
                        'Authorization': `Bearer ${token}`,
                  });

                  if (officersResponse.status === 200 && officersResponse.body.success) {
                        const officerCount = Array.isArray(officersResponse.body.data) ? officersResponse.body.data.length : 0;
                        console.log(`Officers found: ${officerCount}`);
                        printTest('Get officers API returns success', true);
                  } else {
                        printTest('Get officers API returns success', false,
                              `Status: ${officersResponse.status}`);
                        console.log('Response:', officersResponse.body);
                  }
            } catch (error) {
                  printTest('Get officers API returns success', false, error.message);
            }
      } else {
            console.log(`\n${colors.yellow}Test 3: Get Officers (SKIPPED)${colors.reset}`);
            console.log('Skipped due to missing token from login test');
      }

      // Test 4: Create Officer
      if (token) {
            console.log(`\n${colors.yellow}Test 4: Create Officer${colors.reset}`);
            try {
                  const officerEmail = `test-officer-${Date.now()}@example.com`;
                  const createResponse = await makeRequest('POST', '/admin/create-officer', {
                        name: 'Test Officer',
                        email: officerEmail,
                        mobile: '9876543210',
                  }, {
                        'Authorization': `Bearer ${token}`,
                  });

                  if (createResponse.status === 201 && createResponse.body.success) {
                        const officerId = createResponse.body.data?._id;
                        console.log(`Created officer ID: ${officerId}`);
                        printTest('Create officer API returns success', true);
                  } else {
                        printTest('Create officer API returns success', false,
                              `Status: ${createResponse.status}`);
                        console.log('Response:', createResponse.body);
                  }
            } catch (error) {
                  printTest('Create officer API returns success', false, error.message);
            }
      } else {
            console.log(`\n${colors.yellow}Test 4: Create Officer (SKIPPED)${colors.reset}`);
            console.log('Skipped due to missing token from login test');
      }

      // Test 5: Invalid Token Handling
      console.log(`\n${colors.yellow}Test 5: Invalid Token Handling${colors.reset}`);
      try {
            const invalidResponse = await makeRequest('GET', '/admin/session-check', null, {
                  'Authorization': 'Bearer invalid.token.here',
            });

            if (invalidResponse.status === 401) {
                  printTest('Invalid token returns 401 error', true);
            } else {
                  printTest('Invalid token returns 401 error', false,
                        `Expected 401, got ${invalidResponse.status}`);
            }
      } catch (error) {
            printTest('Invalid token returns 401 error', false, error.message);
      }

      // Test 6: Missing Token Handling
      console.log(`\n${colors.yellow}Test 6: Missing Token Handling${colors.reset}`);
      try {
            const noTokenResponse = await makeRequest('GET', '/admin/session-check');

            if (noTokenResponse.status === 401) {
                  printTest('Missing token returns 401 error', true);
            } else {
                  printTest('Missing token returns 401 error', false,
                        `Expected 401, got ${noTokenResponse.status}`);
            }
      } catch (error) {
            printTest('Missing token returns 401 error', false, error.message);
      }

      // Summary
      console.log('\n================================');
      console.log('Test Summary');
      console.log('================================');
      console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
      console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
      console.log(`Total: ${passed + failed}`);
      console.log('');

      if (failed === 0) {
            console.log(`${colors.green}All tests passed!${colors.reset}`);
            process.exit(0);
      } else {
            console.log(`${colors.red}Some tests failed!${colors.reset}`);
            process.exit(1);
      }
}

// Initialize counters as global
global.passed = 0;
global.failed = 0;
passed = global.passed;
failed = global.failed;

// Run tests
runTests().catch(error => {
      console.error('Fatal error:', error);
      process.exit(2);
});
