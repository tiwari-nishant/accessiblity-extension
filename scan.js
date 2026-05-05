const puppeteer = require('puppeteer');
const aChecker = require('accessibility-checker');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://localhost:8000';
const RESULTS_DIR = './results';


const AUTH_CONFIG = {
    enabled: true,
    loginUrl: '/login',
    username: 'service',
    password: 'Pow3rGetsReady4Bob!',
    usernameSelector: 'input[id="username"]',
    passwordSelector: 'input[id="password"]',
    submitSelector: 'button[type="submit"]',
    waitForNavigation: true,
    successIndicator: 'span.nav-tags.header-text' // Checks for ASMI text after login
};
// Hardcoded list of routes to scan
// Add all your routes here (can be relative paths or full URLs)
const ROUTES_TO_SCAN = [
    '/',
    '/#/operations/server-power-operations',
    '/#/operations/host-console',
    '/#/operations/service-login',
    '/#/operations/firmware',
    '/#/operations/reboot-bmc',
    '/#/resource-management/memory',
    '/#/resource-management/power',
    '/#/resource-management/capacity-on-demand',
    '/#/resource-management/field-core-override',
    '/#/resource-management/system-parameters',
    '/#/hardware-status/inventory',
    '/#/hardware-status/sensors',
    '/#/settings/hardware-deconfiguration',
    '/#/hardware-status/pcie-topology',
    '/#/hardware-status/concurrent-maintenance',
    '/#/logs/post-code-logs',
    '/#/logs/event-logs',
    '/#/logs/audit-logs',
    '/#/logs/dumps',
    '/#/logs/deconfiguration-records',
    '/#/settings/date-time',
    '/#/settings/network',
    '/#/settings/power-restore-policy',
    '/#/settings/snmp-alerts',
    '/#/operations/factory-reset',
    '/#/security-and-access/sessions',
    '/#/security-and-access/user-management',
    '/#/security-and-access/ldap',
    '/#/security-and-access/certificates',
    '/#/security-and-access/policies',
    '/#/operations/key-clear',
    '/#/notices'
    // Add more routes as needed
];

/**
 * Build full URL from route
 */
function buildFullUrl(route) {
    if (route.startsWith('http://') || route.startsWith('https://')) {
        return route;
    }
    // Remove trailing slash from base URL and leading slash from route if present
    const baseUrl = BASE_URL.replace(/\/$/, '');
    const path = route.startsWith('/') ? route : '/' + route;
    return baseUrl + path;
}

/**
 * Perform login if authentication is enabled
 */
async function performLogin(page) {
    if (!AUTH_CONFIG.enabled) {
        console.log('Authentication disabled, skipping login...');
        return true;
    }

    console.log('\n' + '='.repeat(60));
    console.log('Performing Authentication...');
    console.log('='.repeat(60));

    try {
        const loginUrl = buildFullUrl(AUTH_CONFIG.loginUrl);
        console.log(`Navigating to login page: ${loginUrl}`);
        
        await page.goto(loginUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for login form to be visible
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to find and fill username field
        console.log('Filling in credentials...');
        const usernameField = await page.$(AUTH_CONFIG.usernameSelector);
        console.log("usernameField",usernameField)
        if (!usernameField) {
            console.error('❌ Could not find username field with selector:', AUTH_CONFIG.usernameSelector);
            return false;
        }
        await usernameField.type(AUTH_CONFIG.username);

        // Try to find and fill password field
        const passwordField = await page.$(AUTH_CONFIG.passwordSelector);
        console.log("passwordField",passwordField)
        if (!passwordField) {
            console.error('❌ Could not find password field with selector:', AUTH_CONFIG.passwordSelector);
            return false;
        }
        await passwordField.type(AUTH_CONFIG.password);

        // Click submit button
        console.log('Submitting login form...');
        const submitButton = await page.$(AUTH_CONFIG.submitSelector);
        if (!submitButton) {
            console.error('❌ Could not find submit button with selector:', AUTH_CONFIG.submitSelector);
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

        // Check if login was successful
        if (AUTH_CONFIG.successIndicator) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to fully load
            const successElement = await page.$(AUTH_CONFIG.successIndicator);
            if (!successElement) {
                console.error('❌ Login may have failed - success indicator not found');
                return false;
            }
            
            // Verify the element contains 'ASMI' text
            const elementText = await page.evaluate(el => el.textContent, successElement);
            if (!elementText.includes('ASMI')) {
                console.error('❌ Login may have failed - ASMI text not found in success indicator');
                return false;
            }
            console.log('✓ Login verified - ASMI indicator found');
        }

        console.log('✓ Login successful!');
        console.log('='.repeat(60));
        return true;

    } catch (error) {
        console.error('❌ Login failed:', error.message);
        console.log('='.repeat(60));
        return false;
    }
}

/**
 * Scan a single page for accessibility issues
 */
async function scanPage(page, url, scanNumber) {
    console.log(`\n[${scanNumber}] Scanning: ${url}`);
    
    try {
        // Navigate to the page
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for dynamic content to load (7 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get page title for better reporting
        const pageTitle = await page.title();
        
        // Perform accessibility scan
        // The accessibility-checker will automatically save results based on .achecker.yml config
        const results = await aChecker.getCompliance(page, `scan-${scanNumber}-${pageTitle.replace(/[^a-z0-9]/gi, '-')}`);        
        // Log summary
        const summary = results.report.summary;
        console.log(`  ✓ Scanned: ${pageTitle}`);
        console.log(`    Violations: ${summary.counts.violation || 0}`);
        console.log(`    Recommendations: ${summary.counts.recommendation || 0}`);
        console.log(`    Manual Checks: ${summary.counts.manual || 0}`);
        
        return {
            url,
            title: pageTitle,
            success: true,
            summary: summary.counts,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error(`  ✗ Error scanning ${url}:`, error.message);
        return {
            url,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Scan all hardcoded routes
 */
async function scanAllRoutes() {
    console.log('='.repeat(60));
    console.log('IBM Accessibility Checker - Route Scanner');
    console.log('='.repeat(60));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Routes to scan: ${ROUTES_TO_SCAN.length}`);
    console.log(`Authentication: ${AUTH_CONFIG.enabled ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(60));
    
    const browser = await puppeteer.launch({
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
    
    // Perform login if authentication is enabled
    if (AUTH_CONFIG.enabled) {
        const loginSuccess = await performLogin(page);
        if (!loginSuccess) {
            console.error('\n❌ Authentication failed. Please check your credentials and selectors.');
            console.error('Tip: You can disable authentication by setting AUTH_CONFIG.enabled = false');
            await browser.close();
            return [];
        }
    }
    
    const allResults = [];
    
    // Scan each hardcoded route
    for (let i = 0; i < ROUTES_TO_SCAN.length; i++) {
        const route = ROUTES_TO_SCAN[i];
        const fullUrl = buildFullUrl(route);
        const scanNumber = i + 1;
        
        const result = await scanPage(page, fullUrl, scanNumber);
        allResults.push(result);
    }
    
    await browser.close();
    
    console.log('\n' + '='.repeat(60));
    console.log(`Scan Complete! Total pages scanned: ${allResults.length}`);
    console.log('='.repeat(60));
    
    // Generate consolidated report using accessibility-checker's built-in functionality
    console.log('\nGenerating consolidated report...');
    try {
        const report = await aChecker.getComplianceHelper();
        console.log('✓ Consolidated report generated by accessibility-checker');
        console.log('  Check the results/ directory for the consolidated report');
    } catch (error) {
        console.log('Note: Consolidated report generation skipped');
    }
    
    return allResults;
}

/**
 * Generate summary statistics
 */
async function generateSummary(allResults) {
    console.log('\nGenerating summary...');
    
    // Calculate overall statistics
    let totalViolations = 0;
    let totalRecommendations = 0;
    let totalManual = 0;
    
    const successfulScans = allResults.filter(r => r.success);
    const failedScans = allResults.filter(r => !r.success);
    
    successfulScans.forEach(result => {
        totalViolations += result.summary.violation || 0;
        totalRecommendations += result.summary.recommendation || 0;
        totalManual += result.summary.manual || 0;
    });
    
    const summary = {
        baseUrl: BASE_URL,
        scanDate: new Date().toISOString(),
        totalPages: allResults.length,
        successfulScans: successfulScans.length,
        failedScans: failedScans.length,
        overallSummary: {
            violations: totalViolations,
            recommendations: totalRecommendations,
            manual: totalManual
        },
        pages: allResults
    };
    
    await fs.writeFile('./accessibility-summary.json', JSON.stringify(summary, null, 2), 'utf8');
    console.log('✓ Summary saved to: ./accessibility-summary.json');
    
    // Print summary to console
    console.log('\n' + '='.repeat(60));
    console.log('SCAN SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages Scanned: ${allResults.length}`);
    console.log(`Successful: ${successfulScans.length}`);
    console.log(`Failed: ${failedScans.length}`);
    console.log('\nOverall Issues Found:');
    console.log(`  Violations: ${totalViolations}`);
    console.log(`  Recommendations: ${totalRecommendations}`);
    console.log(`  Manual Checks: ${totalManual}`);
    console.log('='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
    try {
        // Ensure results directory exists
        await fs.mkdir(RESULTS_DIR, { recursive: true });
        
        // Scan all hardcoded routes
        const results = await scanAllRoutes();
        
        // Generate summary statistics
        await generateSummary(results);
        
        console.log('\n✅ All done! Check the following:');
        console.log(`   - ${RESULTS_DIR}/ (Individual scan reports in HTML and JSON)`);
        console.log(`   - ./accessibility-summary.json (Overall statistics)`);
        console.log('\nTo view the consolidated report:');
        console.log(`   - Open any HTML file in ${RESULTS_DIR}/ directory`);
        console.log(`   - Or use: npx achecker-report-viewer ${RESULTS_DIR}`);
        
    } catch (error) {
        console.error('\n❌ Error during scan:', error);
        process.exit(1);
    }
}

// Run the scanner
main();

// Made with Bob
