const WebSocket = require('ws');
const puppeteer = require('puppeteer');
const aChecker = require('accessibility-checker');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

// Configuration
const WS_PORT = 8080;
const RESULTS_DIR = './results';

// Authentication Configuration
const AUTH_CONFIG = {
    enabled: true,
    loginUrl: '/login',
    username: 'service',
    password: 'Pow3rGetsReady4Bob!',
    usernameSelector: 'input[id="username"]',
    passwordSelector: 'input[id="password"]',
    submitSelector: 'button[type="submit"]',
    waitForNavigation: true,
    successIndicator: 'span.nav-tags.header-text'
};

// Hardcoded list of routes to scan
const ROUTES_TO_SCAN = [
    '/',
    '/#/operations/server-power-operations',
    '/#/operations/reboot-bmc',
    // '/#/operations/firmware',
    // '/#/operations/serial-over-lan',
    // '/#/operations/host-console',
    // '/#/operations/server-led',
    // '/#/operations/factory-reset',
    // '/#/hardware-status',
    // '/#/hardware-status/inventory',
    // '/#/hardware-status/sensors',
    // '/#/logs/event-logs',
    // '/#/logs/post-code-logs',
    // '/#/control/manage-power-usage',
    // '/#/control/reboot-bmc',
    // '/#/control/server-led',
    // '/#/control/server-power-operations',
    // '/#/settings',
    // '/#/settings/date-time',
    // '/#/settings/network',
    // '/#/profile-settings',
    // '/#/access-control/sessions',
    // '/#/access-control/ldap',
    // '/#/access-control/user-management',
    // '/#/resource-management/power',
    // '/#/resource-management/power/power-cap',
    // '/#/security-and-access/certificates',
    // '/#/security-and-access/policies'
];

// Active scan state
let activeScan = null;
let browser = null;

/**
 * Build full URL from route
 */
function buildFullUrl(baseUrl, route) {
    if (route.startsWith('http://') || route.startsWith('https://')) {
        return route;
    }
    const base = baseUrl.replace(/\/$/, '');
    const path = route.startsWith('/') ? route : '/' + route;
    return base + path;
}

/**
 * Perform login if authentication is enabled
 */
async function performLogin(page, baseUrl, ws) {
    if (!AUTH_CONFIG.enabled) {
        ws.send(JSON.stringify({ type: 'log', message: 'Authentication disabled, skipping login...' }));
        return true;
    }

    ws.send(JSON.stringify({ type: 'log', message: 'Performing authentication...' }));

    try {
        const loginUrl = buildFullUrl(baseUrl, AUTH_CONFIG.loginUrl);
        ws.send(JSON.stringify({ type: 'log', message: `Navigating to login page: ${loginUrl}` }));
        
        await page.goto(loginUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        ws.send(JSON.stringify({ type: 'log', message: 'Filling in credentials...' }));
        
        const usernameField = await page.$(AUTH_CONFIG.usernameSelector);
        if (!usernameField) {
            ws.send(JSON.stringify({ type: 'error', message: 'Could not find username field' }));
            return false;
        }
        await usernameField.type(AUTH_CONFIG.username);

        const passwordField = await page.$(AUTH_CONFIG.passwordSelector);
        if (!passwordField) {
            ws.send(JSON.stringify({ type: 'error', message: 'Could not find password field' }));
            return false;
        }
        await passwordField.type(AUTH_CONFIG.password);

        ws.send(JSON.stringify({ type: 'log', message: 'Submitting login form...' }));
        const submitButton = await page.$(AUTH_CONFIG.submitSelector);
        if (!submitButton) {
            ws.send(JSON.stringify({ type: 'error', message: 'Could not find submit button' }));
            return false;
        }

        if (AUTH_CONFIG.waitForNavigation) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
                submitButton.click()
            ]);
        } else {
            await submitButton.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        if (AUTH_CONFIG.successIndicator) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const successElement = await page.$(AUTH_CONFIG.successIndicator);
            if (!successElement) {
                ws.send(JSON.stringify({ type: 'error', message: 'Login failed - success indicator not found' }));
                return false;
            }
            
            const elementText = await page.evaluate(el => el.textContent, successElement);
            if (!elementText.includes('ASMI')) {
                ws.send(JSON.stringify({ type: 'error', message: 'Login failed - ASMI text not found' }));
                return false;
            }
            ws.send(JSON.stringify({ type: 'log', message: '✓ Login verified - ASMI indicator found' }));
        }

        ws.send(JSON.stringify({ type: 'log', message: '✓ Login successful!' }));
        return true;

    } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: `Login failed: ${error.message}` }));
        return false;
    }
}

/**
 * Scan a single page
 */
async function scanPage(page, url, scanNumber, totalPages, ws) {
    ws.send(JSON.stringify({ 
        type: 'progress', 
        current: scanNumber, 
        total: totalPages,
        url: url,
        message: `Scanning page ${scanNumber}/${totalPages}: ${url}`
    }));

    try {
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 7000));
        
        const pageTitle = await page.title();
        
        const results = await aChecker.getCompliance(page, `scan-${scanNumber}-${pageTitle.replace(/[^a-z0-9]/gi, '-')}`);
        
        const summary = results.report.summary;
        ws.send(JSON.stringify({ 
            type: 'scan-complete', 
            scanNumber: scanNumber,
            title: pageTitle,
            url: url,
            violations: summary.counts.violation || 0,
            recommendations: summary.counts.recommendation || 0,
            manual: summary.counts.manual || 0
        }));
        
        return {
            url,
            title: pageTitle,
            success: true,
            summary: summary.counts,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        ws.send(JSON.stringify({ 
            type: 'error', 
            message: `Error scanning ${url}: ${error.message}` 
        }));
        return {
            url,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Generate CSV report from scan results
 */
async function generateCSVReport(allResults, baseUrl) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(RESULTS_DIR, `accessibility-report-${timestamp}.csv`);
    
    // CSV Header
    let csv = 'Scan Number,Page Title,Page URL,Violations,Recommendations,Manual Checks,Total Issues,Status,Timestamp\n';
    
    // Add each scan result
    allResults.forEach((result, index) => {
        if (result.success) {
            const violations = result.summary.violation || 0;
            const recommendations = result.summary.recommendation || 0;
            const manual = result.summary.manual || 0;
            const total = violations + recommendations;
            
            csv += `${index + 1},"${result.title}","${result.url}",${violations},${recommendations},${manual},${total},Success,${result.timestamp}\n`;
        } else {
            csv += `${index + 1},"Error","${result.url}",0,0,0,0,Failed: ${result.error},${result.timestamp}\n`;
        }
    });
    
    // Add summary row
    const successfulScans = allResults.filter(r => r.success);
    const totalViolations = successfulScans.reduce((sum, r) => sum + (r.summary.violation || 0), 0);
    const totalRecommendations = successfulScans.reduce((sum, r) => sum + (r.summary.recommendation || 0), 0);
    const totalManual = successfulScans.reduce((sum, r) => sum + (r.summary.manual || 0), 0);
    const totalIssues = totalViolations + totalRecommendations;
    
    csv += `\nSummary,,${baseUrl},${totalViolations},${totalRecommendations},${totalManual},${totalIssues},${successfulScans.length}/${allResults.length} successful,${new Date().toISOString()}\n`;
    
    await fs.writeFile(csvPath, csv, 'utf8');
    return csvPath;
}

/**
 * Start accessibility scan
 */
async function startScan(baseUrl, ws) {
    if (activeScan) {
        ws.send(JSON.stringify({ type: 'error', message: 'A scan is already in progress' }));
        return;
    }

    activeScan = { cancelled: false };
    
    try {
        await fs.mkdir(RESULTS_DIR, { recursive: true });
        
        ws.send(JSON.stringify({ type: 'log', message: 'Starting accessibility scan...' }));
        ws.send(JSON.stringify({ type: 'log', message: `Base URL: ${baseUrl}` }));
        ws.send(JSON.stringify({ type: 'log', message: `Routes to scan: ${ROUTES_TO_SCAN.length}` }));
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list'
            ]
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Perform login
        if (AUTH_CONFIG.enabled) {
            const loginSuccess = await performLogin(page, baseUrl, ws);
            if (!loginSuccess) {
                ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
                await browser.close();
                activeScan = null;
                return;
            }
        }
        
        const allResults = [];
        const totalPages = ROUTES_TO_SCAN.length;
        
        // Scan each route
        for (let i = 0; i < ROUTES_TO_SCAN.length; i++) {
            if (activeScan.cancelled) {
                ws.send(JSON.stringify({ type: 'cancelled', message: 'Scan cancelled by user' }));
                break;
            }
            
            const route = ROUTES_TO_SCAN[i];
            const fullUrl = buildFullUrl(baseUrl, route);
            const scanNumber = i + 1;
            
            const result = await scanPage(page, fullUrl, scanNumber, totalPages, ws);
            allResults.push(result);
        }
        
        await browser.close();
        browser = null;
        
        if (!activeScan.cancelled) {
            // Generate CSV report
            ws.send(JSON.stringify({ type: 'log', message: 'Generating CSV report...' }));
            const csvPath = await generateCSVReport(allResults, baseUrl);
            
            // Read CSV file and send it to client
            const csvContent = await fs.readFile(csvPath, 'utf8');
            
            ws.send(JSON.stringify({ 
                type: 'complete', 
                message: 'Scan complete!',
                totalScanned: allResults.length,
                successful: allResults.filter(r => r.success).length,
                csvPath: csvPath,
                csvContent: csvContent
            }));
        }
        
    } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: `Scan error: ${error.message}` }));
        if (browser) {
            await browser.close();
            browser = null;
        }
    } finally {
        activeScan = null;
    }
}

/**
 * Cancel active scan
 */
async function cancelScan(ws) {
    if (!activeScan) {
        ws.send(JSON.stringify({ type: 'error', message: 'No active scan to cancel' }));
        return;
    }
    
    activeScan.cancelled = true;
    ws.send(JSON.stringify({ type: 'log', message: 'Cancelling scan...' }));
    
    if (browser) {
        await browser.close();
        browser = null;
    }
}

// Create WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

console.log(`WebSocket server started on ws://localhost:${WS_PORT}`);
console.log('Waiting for browser extension connections...');

wss.on('connection', (ws) => {
    console.log('Browser extension connected');
    
    ws.send(JSON.stringify({ 
        type: 'connected', 
        message: 'Connected to accessibility scan server' 
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'start-scan':
                    await startScan(data.baseUrl, ws);
                    break;
                    
                case 'cancel-scan':
                    await cancelScan(ws);
                    break;
                    
                default:
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: `Unknown command: ${data.type}` 
                    }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: `Server error: ${error.message}` 
            }));
        }
    });
    
    ws.on('close', () => {
        console.log('Browser extension disconnected');
        if (activeScan) {
            cancelScan(ws);
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handle server shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    if (browser) {
        await browser.close();
    }
    wss.close();
    process.exit(0);
});

// Made with Bob
