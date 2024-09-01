const express = require('express');
const { JSONRPCClient } = require('json-rpc-2.0');
const http = require('http');

const app = express();
const port = 3000;

// Create an instance of JSONRPCClient
const adbClient = new JSONRPCClient((jsonRPCRequest) =>
    http
        .request(
            {
                hostname: '127.0.0.1',
                port: 5037,
                path: '/',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            },
            (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        adbClient.receive(JSON.parse(data));
                    } else {
                        console.error(`Failed with status code: ${res.statusCode}`);
                    }
                });
            }
        )
        .end(JSON.stringify(jsonRPCRequest))
);

// Function to call ADB using JSON-RPC
const callAdb = async () => {
    try {
        const result = await adbClient.request('adbCommand', { command: 'adb shell monkey -p id.dana 1' });
        console.log('ADB Result:', result);
    } catch (error) {
        console.error('Error calling ADB:', error);
    }
};

// Route to start the interval
let intervalId;
app.get('/', (req, res) => {
    const interval = parseInt(req.query.interval, 10) || 30000; // Default interval of 30 seconds
    if (intervalId) clearInterval(intervalId);
    callAdb();
    intervalId = setInterval(callAdb, interval);
    res.send(`Interval started with ${interval}ms.`);
});

// Route to stop the interval
app.get('/stop-interval', (req, res) => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        res.send('Interval stopped.');
    } else {
        res.send('No interval running.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
