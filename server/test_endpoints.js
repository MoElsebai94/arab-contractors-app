const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
    console.log('Starting API Test...');

    // Test Production Item Creation
    try {
        const prodRes = await axios.post(`${BASE_URL}/api/storage/production`, {
            name: 'Test Item',
            category: 'Test',
            target_quantity: 100,
            current_quantity: 0,
            daily_rate: 10,
            mold_count: 5
        });
        console.log('✅ POST /api/storage/production: Success', prodRes.data);
    } catch (error) {
        console.error('❌ POST /api/storage/production: Failed', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }

    // Test Iron Item Creation
    try {
        const ironRes = await axios.post(`${BASE_URL}/api/storage/iron`, {
            diameter: 'ΦTest',
            quantity: 500
        });
        console.log('✅ POST /api/storage/iron: Success', ironRes.data);
    } catch (error) {
        console.error('❌ POST /api/storage/iron: Failed', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }

    // Test Cement Item Creation
    try {
        const cementRes = await axios.post(`${BASE_URL}/api/storage/cement`, {
            type: 'Test Cement',
            quantity: 200
        });
        console.log('✅ POST /api/storage/cement: Success', cementRes.data);
    } catch (error) {
        console.error('❌ POST /api/storage/cement: Failed', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

testEndpoints();
