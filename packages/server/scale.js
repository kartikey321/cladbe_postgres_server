const pm2 = require('pm2');
const os = require('os');
const http = require('http');

// Configuration
const APP_NAME = 'hono-ts-backend';
const MIN_INSTANCES = 1; // Minimum instances under low load
const MAX_CORES_PERCENTAGE = 0.5; // Use up to 50% of cores
const CHECK_INTERVAL = 30000; // Check every 30 seconds
const LOAD_THRESHOLD_HIGH = 0.7; // Scale up if CPU load > 70%
const LOAD_THRESHOLD_LOW = 0.3; // Scale down if CPU load < 30%

// Calculate max instances (50% of cores, rounded up)
const totalCores = os.cpus().length;
const maxInstances = Math.ceil(totalCores * MAX_CORES_PERCENTAGE);

// Function to get CPU load (simplified, based on os.loadavg)
function getCpuLoad() {
    const load = os.loadavg()[0]; // 1-minute average
    return load / totalCores; // Normalize by core count
}

// Function to get request rate (requires app to expose metrics)
async function getRequestRate() {
    return new Promise((resolve) => {
        http.get('http://localhost:3000/health', (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const { requestCount = 0 } = JSON.parse(data);
                    resolve(requestCount);
                } catch {
                    resolve(0);
                }
            });
        }).on('error', () => resolve(0));
    });
}

// Scaling logic
async function scale() {
    pm2.connect((err) => {
        if (err) {
            console.error('PM2 connection error:', err);
            process.exit(2);
        }

        pm2.describe(APP_NAME, async (err, desc) => {
            if (err) {
                console.error('PM2 describe error:', err);
                pm2.disconnect();
                return;
            }

            const currentInstances = desc[0]?.pm2_env?.instances || MIN_INSTANCES;
            const cpuLoad = getCpuLoad();
            const requestRate = await getRequestRate();

            console.log(`Current instances: ${currentInstances}, CPU load: ${(cpuLoad * 100).toFixed(2)}%, Request rate: ${requestRate}`);

            let targetInstances = currentInstances;

            // Scale up if CPU load is high or request rate is significant
            if (cpuLoad > LOAD_THRESHOLD_HIGH || requestRate > 100) {
                targetInstances = Math.min(currentInstances + 1, maxInstances);
            }
            // Scale down if CPU load is low and minimal requests
            else if (cpuLoad < LOAD_THRESHOLD_LOW && requestRate < 10 && currentInstances > MIN_INSTANCES) {
                targetInstances = currentInstances - 1;
            }

            if (targetInstances !== currentInstances) {
                console.log(`Scaling to ${targetInstances} instances`);
                pm2.scale(APP_NAME, targetInstances, (err) => {
                    if (err) console.error('PM2 scale error:', err);
                    else console.log(`Scaled to ${targetInstances} instances`);
                    pm2.disconnect();
                });
            } else {
                console.log('No scaling needed');
                pm2.disconnect();
            }
        });
    });
}

// Run scaling check periodically
setInterval(scale, CHECK_INTERVAL);
scale(); // Run immediately