const http = require('http');

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testReorder() {
    try {
        console.log("Fetching current items...");
        const response = await makeRequest('GET', '/api/storage/production');
        const items = response.data;

        if (items.length < 2) {
            console.log("Not enough items to test reorder.");
            return;
        }

        console.log("Current order IDs:", items.map(i => `${i.id} (order: ${i.display_order})`));

        // Swap first two items
        const item1 = items[0];
        const item2 = items[1];

        const updates = [
            { id: item1.id, display_order: item2.display_order }, // Swap orders
            { id: item2.id, display_order: item1.display_order }
        ];

        // Also update the rest to keep their order
        for (let i = 2; i < items.length; i++) {
            updates.push({ id: items[i].id, display_order: items[i].display_order });
        }

        // Actually, let's just assign new sequential orders to be sure
        const reorderedItems = [...items];
        const temp = reorderedItems[0];
        reorderedItems[0] = reorderedItems[1];
        reorderedItems[1] = temp;

        const payload = reorderedItems.map((item, index) => ({
            id: item.id,
            display_order: index
        }));

        console.log("Sending reorder request with swapped first two items...");
        console.log("Payload IDs order:", payload.map(p => p.id));

        await makeRequest('PUT', '/api/storage/production/reorder', { items: payload });

        console.log("Fetching items again...");
        const response2 = await makeRequest('GET', '/api/storage/production');
        const newItems = response2.data;

        console.log("New order IDs:", newItems.map(i => `${i.id} (order: ${i.display_order})`));

        if (newItems[0].id === item2.id && newItems[1].id === item1.id) {
            console.log("SUCCESS: Order persisted.");
        } else {
            console.log("FAILURE: Order did not persist.");
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testReorder();
