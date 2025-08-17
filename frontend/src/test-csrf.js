/**
 * Simple test script to verify CSRF protection and token handling
 * Run this in the browser console on your application
 */

async function testCsrfFlow() {
  console.log('=== Testing CSRF Flow ===');

  // Step 1: Test getting a CSRF token
  console.log('\n1. Fetching CSRF token...');
  try {
    const tokenResponse = await fetch(
      'http://localhost:8080/api/v1/csrf/token',
      {
        method: 'GET',
        credentials: 'include',
      },
    );

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get CSRF token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ CSRF token received:', tokenData.token);

    // Step 2: Test a protected endpoint without CSRF token
    console.log('\n2. Testing protected endpoint WITHOUT CSRF token...');
    try {
      const testResponse = await fetch('http://localhost:8080/api/v1/teacher', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const testData = await testResponse.json();
      console.log(`Response status: ${testResponse.status}`);
      console.log('Response data:', testData);

      if (
        testResponse.status === 403 &&
        testData.code === 'CSRF_VALIDATION_FAILED'
      ) {
        console.log(
          '✅ CSRF protection working - request blocked without token',
        );
      } else {
        console.log(
          '❌ CSRF protection not working - request allowed without token',
        );
      }
    } catch (error) {
      console.error('Error testing protected endpoint:', error);
    }

    // Step 3: Test a protected endpoint with CSRF token
    console.log('\n3. Testing protected endpoint WITH CSRF token...');
    try {
      const testResponse = await fetch('http://localhost:8080/api/v1/teacher', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': tokenData.token,
        },
        body: JSON.stringify({ test: 'data' }),
      });

      console.log(`Response status: ${testResponse.status}`);

      if (testResponse.status !== 403) {
        console.log('✅ CSRF token accepted');
      } else {
        const testData = await testResponse.json();
        console.log('❌ CSRF token rejected:', testData);
      }
    } catch (error) {
      console.error('Error testing protected endpoint with token:', error);
    }

    // Step 4: Test logout endpoint (should be excluded from CSRF protection)
    console.log(
      '\n4. Testing logout endpoint (should be excluded from CSRF)...',
    );
    try {
      const logoutResponse = await fetch(
        'http://localhost:8080/api/v1/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      console.log(`Logout response status: ${logoutResponse.status}`);

      if (logoutResponse.ok) {
        console.log('✅ Logout endpoint works without CSRF token');
      } else {
        const logoutData = await logoutResponse.json();
        console.log('❌ Logout endpoint failed:', logoutData);
      }
    } catch (error) {
      console.error('Error testing logout endpoint:', error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testCsrfFlow();
