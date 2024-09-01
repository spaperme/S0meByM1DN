const express = require('express');
const JsonRpcClient = require('jsonrpc-client');

const app = express();
const port = 3000;

// Initialize the JSON-RPC client
const adbClient = new JsonRpcClient({ host: '127.0.0.1', port: '5037' }); // Adjust ADB host and port if necessary

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
app.get('/start-interval', (req, res) => {
    const interval = parseInt(req.query.interval, 10) || 30000; // Default interval of 30 seconds
    if (intervalId) clearInterval(intervalId);
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
