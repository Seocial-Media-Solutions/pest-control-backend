/**
 * Dashboard API Test Script
 * Run this script to test all dashboard endpoints
 */

const BASE_URL = 'http://localhost:3000/api/dashboard';

// Test function
async function testEndpoint(name, url) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📍 URL: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success!');
            console.log('📊 Response:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        } else {
            console.log('❌ Failed!');
            console.log('Error:', data);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Dashboard API Tests...\n');
    console.log('='.repeat(60));

    // Test 1: Dashboard Stats
    await testEndpoint(
        'Dashboard Statistics',
        `${BASE_URL}/stats`
    );

    // Test 2: Assignment Trends (Month)
    await testEndpoint(
        'Assignment Trends (Month)',
        `${BASE_URL}/trends?period=month`
    );

    // Test 3: Assignment Trends (Week)
    await testEndpoint(
        'Assignment Trends (Week)',
        `${BASE_URL}/trends?period=week`
    );

    // Test 4: Technician Activity
    await testEndpoint(
        'Technician Activity',
        `${BASE_URL}/technician-activity`
    );

    // Test 5: Revenue Analytics
    await testEndpoint(
        'Revenue Analytics',
        `${BASE_URL}/revenue-analytics`
    );

    // Test 6: All Dashboard Data
    await testEndpoint(
        'All Dashboard Data',
        `${BASE_URL}/all`
    );

    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests completed!\n');
}

// Run the tests
runTests();
