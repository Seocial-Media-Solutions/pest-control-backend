/**
 * Assignment Routes Test Script
 * Tests all 15 assignment API endpoints
 */

const BASE_URL = 'http://localhost:3000/api';

// Store IDs for testing
const fs = require('fs');
let testIds = {
    customer: '6964e1efd35a4145a29db3b1', // Default fallback
    technician: '695cdd4704ab20fe72e012fa' // Default fallback
};

try {
    if (fs.existsSync('./test-ids.json')) {
        const data = fs.readFileSync('./test-ids.json', 'utf8');
        testIds = JSON.parse(data);
        console.log('✅ Loaded IDs from test-ids.json:', testIds);
    }
} catch (e) {
    console.log('⚠️ Could not load test-ids.json, using defaults');
}

let assignmentId = null;
let treatmentItemId = null;
let pictureId = null;
let paymentId = null;

// Helper function to make requests
async function makeRequest(method, endpoint, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return {
            status: response.status,
            success: response.ok,
            data
        };
    } catch (error) {
        return {
            status: 0,
            success: false,
            error: error.message
        };
    }
}

// Test functions
async function test1_CreateAssignment() {
    console.log('\n📝 TEST 1: Create Assignment');
    console.log('POST /api/assignments');

    const result = await makeRequest('POST', '/assignments', {
        customer: testIds.customer,
        technicianId: testIds.technician,
        bookingId: testIds.bookingId || null,
        status: 'pending'
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.success && result.data.data) {
        assignmentId = result.data.data._id;
        console.log(`✅ Assignment created with ID: ${assignmentId}`);
    } else {
        console.log('⚠️ Assignment creation failed or returned unexpected format');
    }

    return result;
}

async function test2_GetAllAssignments() {
    console.log('\n📋 TEST 2: Get All Assignments');
    console.log('GET /api/assignments');

    const result = await makeRequest('GET', '/assignments');

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log(`Count: ${result.data.count || 0}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test3_GetAssignmentById() {
    if (!assignmentId) {
        console.log('\n⏭️ TEST 3: Skipped (no assignment ID)');
        return;
    }

    console.log('\n🔍 TEST 3: Get Assignment by ID');
    console.log(`GET /api/assignments/${assignmentId}`);

    const result = await makeRequest('GET', `/assignments/${assignmentId}`);

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test4_AssignTechnician() {
    if (!assignmentId) {
        console.log('\n⏭️ TEST 4: Skipped (no assignment ID)');
        return;
    }

    console.log('\n👷 TEST 4: Assign Technician');
    console.log(`PATCH /api/assignments/${assignmentId}/assign`);

    const result = await makeRequest('PATCH', `/assignments/${assignmentId}/assign`, {
        technicianId: testIds.technician
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test5_AddTreatmentPreparation() {
    if (!assignmentId) {
        console.log('\n⏭️ TEST 5: Skipped (no assignment ID)');
        return;
    }

    console.log('\n💊 TEST 5: Add Treatment Preparation');
    console.log(`POST /api/assignments/${assignmentId}/treatment-preparation`);

    const result = await makeRequest('POST', `/assignments/${assignmentId}/treatment-preparation`, {
        chemicals: 'Cypermethrin 10% EC',
        quantity: '500ml',
        instructions: 'Mix with 5 liters of water. Spray on affected areas thoroughly.'
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.success && result.data.data && result.data.data.treatmentPreparation) {
        const items = result.data.data.treatmentPreparation;
        if (items.length > 0) {
            treatmentItemId = items[items.length - 1]._id;
            console.log(`✅ Treatment item added with ID: ${treatmentItemId}`);
        }
    }

    return result;
}

async function test6_UpdateTreatmentPreparation() {
    if (!assignmentId || !treatmentItemId) {
        console.log('\n⏭️ TEST 6: Skipped (no assignment or treatment item ID)');
        return;
    }

    console.log('\n✏️ TEST 6: Update Treatment Preparation');
    console.log(`PUT /api/assignments/${assignmentId}/treatment-preparation/${treatmentItemId}`);

    const result = await makeRequest('PUT', `/assignments/${assignmentId}/treatment-preparation/${treatmentItemId}`, {
        chemicals: 'Cypermethrin 25% EC (Updated)',
        quantity: '1000ml',
        instructions: 'Updated: Mix with 10 liters of water for better coverage.'
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test7_AddSitePicture() {
    if (!assignmentId) {
        console.log('\n⏭️ TEST 7: Skipped (no assignment ID)');
        return;
    }

    console.log('\n📸 TEST 7: Add Site Picture');
    console.log(`POST /api/assignments/${assignmentId}/site-pictures`);

    const result = await makeRequest('POST', `/assignments/${assignmentId}/site-pictures`, {
        publicId: 'test_site_photo_001',
        url: 'https://example.com/images/site-before-treatment.jpg',
        filename: 'site_before_treatment.jpg',
        width: 1920,
        height: 1080
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.success && result.data.data && result.data.data.applyTreatment) {
        const pictures = result.data.data.applyTreatment.sitePictures;
        if (pictures && pictures.length > 0) {
            pictureId = pictures[pictures.length - 1]._id;
            console.log(`✅ Picture added with ID: ${pictureId}`);
        }
    }

    return result;
}

async function test8_AddPaymentCollection() {
    if (!assignmentId) {
        console.log('\n⏭️ TEST 8: Skipped (no assignment ID)');
        return;
    }

    console.log('\n💰 TEST 8: Add Payment Collection');
    console.log(`POST /api/assignments/${assignmentId}/payment-collection`);

    const result = await makeRequest('POST', `/assignments/${assignmentId}/payment-collection`, {
        amount: 5000,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
        paymentStatus: 'completed'
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.success && result.data.data && result.data.data.paymentCollection) {
        const payments = result.data.data.paymentCollection;
        if (payments.length > 0) {
            paymentId = payments[payments.length - 1]._id;
            console.log(`✅ Payment added with ID: ${paymentId}`);
        }
    }

    return result;
}

async function test9_UpdatePaymentCollection() {
    if (!assignmentId || !paymentId) {
        console.log('\n⏭️ TEST 9: Skipped (no assignment or payment ID)');
        return;
    }

    console.log('\n💳 TEST 9: Update Payment Collection');
    console.log(`PUT /api/assignments/${assignmentId}/payment-collection/${paymentId}`);

    const result = await makeRequest('PUT', `/assignments/${assignmentId}/payment-collection/${paymentId}`, {
        amount: 6000,
        paymentMethod: 'upi',
        paymentStatus: 'completed'
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test10_UpdateAssignment() {
    if (!assignmentId) {
        console.log('\n⏭️ TEST 10: Skipped (no assignment ID)');
        return;
    }

    console.log('\n📝 TEST 10: Update Assignment');
    console.log(`PUT /api/assignments/${assignmentId}`);

    const result = await makeRequest('PUT', `/assignments/${assignmentId}`, {
        status: 'in_progress',
        technicianId: testIds.technician
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test11_GetAssignmentsByTechnician() {
    console.log('\n👨‍🔧 TEST 11: Get Assignments by Technician');
    console.log(`GET /api/assignments/technician/${testIds.technician}`);

    const result = await makeRequest('GET', `/assignments/technician/${testIds.technician}`);

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log(`Count: ${result.data.count || 0}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test12_DeleteSitePicture() {
    if (!assignmentId || !pictureId) {
        console.log('\n⏭️ TEST 12: Skipped (no assignment or picture ID)');
        return;
    }

    console.log('\n🗑️ TEST 12: Delete Site Picture');
    console.log(`DELETE /api/assignments/${assignmentId}/site-pictures/${pictureId}`);

    const result = await makeRequest('DELETE', `/assignments/${assignmentId}/site-pictures/${pictureId}`);

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test13_DeletePaymentCollection() {
    if (!assignmentId || !paymentId) {
        console.log('\n⏭️ TEST 13: Skipped (no assignment or payment ID)');
        return;
    }

    console.log('\n🗑️ TEST 13: Delete Payment Collection');
    console.log(`DELETE /api/assignments/${assignmentId}/payment-collection/${paymentId}`);

    const result = await makeRequest('DELETE', `/assignments/${assignmentId}/payment-collection/${paymentId}`);

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test14_DeleteTreatmentPreparation() {
    if (!assignmentId || !treatmentItemId) {
        console.log('\n⏭️ TEST 14: Skipped (no assignment or treatment item ID)');
        return;
    }

    console.log('\n🗑️ TEST 14: Delete Treatment Preparation');
    console.log(`DELETE /api/assignments/${assignmentId}/treatment-preparation/${treatmentItemId}`);

    const result = await makeRequest('DELETE', `/assignments/${assignmentId}/treatment-preparation/${treatmentItemId}`);

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

async function test15_DeleteAssignment() {
    if (!assignmentId) {
        console.log('\n⏭️ TEST 15: Skipped (no assignment ID)');
        return;
    }

    console.log('\n🗑️ TEST 15: Delete Assignment');
    console.log(`DELETE /api/assignments/${assignmentId}`);

    const result = await makeRequest('DELETE', `/assignments/${assignmentId}`);

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    return result;
}

// Run all tests
async function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     ASSIGNMENT API ROUTES - COMPREHENSIVE TEST         ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`\n🕐 Started at: ${new Date().toLocaleString()}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);

    const results = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    try {
        // Test in logical order
        const tests = [
            test1_CreateAssignment,
            test2_GetAllAssignments,
            test3_GetAssignmentById,
            test4_AssignTechnician,
            test5_AddTreatmentPreparation,
            test6_UpdateTreatmentPreparation,
            test7_AddSitePicture,
            test8_AddPaymentCollection,
            test9_UpdatePaymentCollection,
            test10_UpdateAssignment,
            test11_GetAssignmentsByTechnician,
            test12_DeleteSitePicture,
            test13_DeletePaymentCollection,
            test14_DeleteTreatmentPreparation,
            test15_DeleteAssignment
        ];

        for (const test of tests) {
            const result = await test();
            if (!result) {
                results.skipped++;
            } else if (result.success) {
                results.passed++;
            } else {
                results.failed++;
            }
            // Wait a bit between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

    } catch (error) {
        console.error('\n❌ Test suite error:', error);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`✅ Passed:  ${results.passed}`);
    console.log(`❌ Failed:  ${results.failed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`📊 Total:   ${results.passed + results.failed + results.skipped}`);
    console.log(`\n🕐 Completed at: ${new Date().toLocaleString()}`);
}

// Run the tests
runAllTests().catch(console.error);
