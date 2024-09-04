const express = require('express');
const { JSONRPCClient } = require('json-rpc-2.0');
const http = require('http');
const { exec } = require('child_process');

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
app.get('/test', (req, res) => {
    const interval = parseInt(req.query.interval, 10) || 30000; // Default interval of 30 seconds
    if (intervalId) clearInterval(intervalId);
    callAdb();
    intervalId = setInterval(callAdb, interval);
    res.send(`Interval started with ${interval}ms.`);
});

app.get('/', (req, res) => {
    exec('adb shell monkey -p id.dana 1', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
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

app.use(bodyParser.json());
// Create a new JSON-RPC server instance
const server = new JSONRPCServer();

// Define the `click` method
server.addMethod('click', async (params) => {
    const { x, y } = params;
    return new Promise((resolve, reject) => {
        exec(`adb shell input tap ${x} ${y}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
});

// Define the `swipe` method
server.addMethod('swipe', async (params) => {
    const { startX, startY, endX, endY, duration } = params;
    return new Promise((resolve, reject) => {
        exec(`adb shell input swipe ${startX} ${startY} ${endX} ${endY} ${duration}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
});

// Route to handle JSON-RPC requests
app.post('/jsonrpc/0', async (req, res) => {
    try {
        const response = await server.receive(req.body);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
