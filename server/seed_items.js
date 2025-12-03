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

async function seedItems() {
    try {
        console.log("Adding Item 1...");
        await makeRequest('POST', '/api/storage/production', {
            name: 'Test Item 1',
            category: 'Prefabrication',
            target_quantity: 100,
            current_quantity: 0,
            daily_rate: 10,
            mold_count: 5
        });

        console.log("Adding Item 2...");
        await makeRequest('POST', '/api/storage/production', {
            name: 'Test Item 2',
            category: 'Prefabrication',
            target_quantity: 200,
            current_quantity: 0,
            daily_rate: 20,
            mold_count: 10
        });

        console.log("Seeding complete.");

    } catch (error) {
        console.error("Seeding failed:", error);
    }
}

seedItems();
