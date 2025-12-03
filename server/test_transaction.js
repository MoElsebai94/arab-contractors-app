const axios = require('axios');

async function testTransaction() {
    try {
        // 1. Get a cement item ID
        const listRes = await axios.get('http://localhost:3001/api/storage/cement');
        if (listRes.data.data.length === 0) {
            console.log('No cement items found to test with.');
            return;
        }
        const cementId = listRes.data.data[0].id;
        console.log(`Testing with Cement ID: ${cementId}`);

        // 2. Post a transaction
        const transRes = await axios.post('http://localhost:3001/api/storage/cement/transaction', {
            cement_id: cementId,
            type: 'IN',
            quantity: 50,
            description: 'Test Transaction'
        });
        console.log('✅ Transaction Success:', transRes.data);

    } catch (error) {
        console.error('❌ Transaction Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

testTransaction();
