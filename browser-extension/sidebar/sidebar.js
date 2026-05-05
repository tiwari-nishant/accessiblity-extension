// WebSocket connection
let ws = null;
let isScanning = false;
let scanResults = {
    totalViolations: 0,
    totalRecommendations: 0,
    totalManual: 0,
    totalIssues: 0,
    scannedPages: 0,
    totalPages: 0
};

// DOM elements
const runScanBtn = document.getElementById('run-scan');
const cancelScanBtn = document.getElementById('cancel-scan');
const connectionStatus = document.getElementById('connection-status');
const urlDisplay = document.getElementById('url-display');
const progressSection = document.getElementById('progress-section');
const summarySection = document.getElementById('summary-section');
const progressText = document.getElementById('progress-text');
const progressCount = document.getElementById('progress-count');
const progressFill = document.getElementById('progress-fill');
const currentPage = document.getElementById('current-page');
const logs = document.getElementById('logs');
const clearLogsBtn = document.getElementById('clear-logs');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    updateCurrentUrl();
    
    runScanBtn.addEventListener('click', startScan);
    cancelScanBtn.addEventListener('click', cancelScan);
    clearLogsBtn.addEventListener('click', clearLogs);
});

/**
 * Connect to WebSocket server
 */
function connectWebSocket() {
    try {
        ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = () => {
            updateConnectionStatus('connected');
            addLog('Connected to scan server', 'success');
        };
        
        ws.onmessage = (event) => {
            handleServerMessage(JSON.parse(event.data));
        };
        
        ws.onerror = (error) => {
            updateConnectionStatus('disconnected');
            addLog('WebSocket error - Make sure the server is running', 'error');
        };
        
        ws.onclose = () => {
            updateConnectionStatus('disconnected');
            addLog('Disconnected from server', 'error');
            // Try to reconnect after 5 seconds
            setTimeout(connectWebSocket, 5000);
        };
    } catch (error) {
        updateConnectionStatus('disconnected');
        addLog(`Connection error: ${error.message}`, 'error');
    }
}

/**
 * Update connection status display
 */
function updateConnectionStatus(status) {
    connectionStatus.className = `status ${status}`;
    const statusText = connectionStatus.querySelector('.status-text');
    
    switch(status) {
        case 'connected':
            statusText.textContent = 'Connected';
            runScanBtn.disabled = false;
            break;
        case 'scanning':
            statusText.textContent = 'Scanning...';
            break;
        case 'disconnected':
            statusText.textContent = 'Disconnected';
            runScanBtn.disabled = true;
            break;
    }
}

/**
 * Get and validate current tab URL
 */
async function updateCurrentUrl() {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            const url = tabs[0].url;
            urlDisplay.textContent = url;
            
            // Check if URL contains localhost or stglabs
            const isValid = url.includes('localhost') || url.includes('stglabs');
            
            if (!isValid && ws && ws.readyState === WebSocket.OPEN) {
                runScanBtn.disabled = true;
                addLog('Invalid URL - Must contain "localhost" or "stglabs"', 'error');
            } else if (ws && ws.readyState === WebSocket.OPEN) {
                runScanBtn.disabled = false;
            }
            
            return { url, isValid };
        }
    } catch (error) {
        addLog(`Error getting current URL: ${error.message}`, 'error');
    }
    return { url: null, isValid: false };
}

/**
 * Start accessibility scan
 */
async function startScan() {
    const { url, isValid } = await updateCurrentUrl();
    
    if (!isValid) {
        alert('Please be on the BMC overview page\n\nThe URL must contain "localhost" or "stglabs"');
        return;
    }
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to scan server. Please start the server with: npm run server');
        return;
    }
    
    // Reset state
    isScanning = true;
    scanResults = {
        totalViolations: 0,
        totalRecommendations: 0,
        totalManual: 0,
        totalIssues: 0,
        scannedPages: 0,
        totalPages: 0
    };
    
    // Update UI
    runScanBtn.disabled = true;
    cancelScanBtn.disabled = false;
    updateConnectionStatus('scanning');
    progressSection.style.display = 'block';
    summarySection.style.display = 'none';
    progressFill.style.width = '0%';
    
    addLog(`Starting scan for: ${url}`, 'info');
    
    // Send scan request
    ws.send(JSON.stringify({
        type: 'start-scan',
        baseUrl: url
    }));
}

/**
 * Cancel ongoing scan
 */
function cancelScan() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        // If WebSocket is not connected, reset UI immediately
        resetScanUI();
        return;
    }
    
    addLog('Cancelling scan...', 'info');
    ws.send(JSON.stringify({ type: 'cancel-scan' }));
}

/**
 * Reset scan UI to initial state
 */
function resetScanUI() {
    isScanning = false;
    runScanBtn.disabled = false;
    cancelScanBtn.disabled = true;
    updateConnectionStatus('connected');
    progressSection.style.display = 'none';
}

/**
 * Handle messages from WebSocket server
 */
function handleServerMessage(data) {
    switch(data.type) {
        case 'connected':
            addLog(data.message, 'success');
            break;
            
        case 'log':
            addLog(data.message, 'info');
            break;
            
        case 'error':
            addLog(`Error: ${data.message}`, 'error');
            break;
            
        case 'progress':
            handleProgress(data);
            break;
            
        case 'scan-complete':
            handleScanComplete(data);
            break;
            
        case 'complete':
            handleAllComplete(data);
            break;
            
        case 'cancelled':
            handleCancelled(data);
            break;
    }
}

/**
 * Handle scan progress update
 */
function handleProgress(data) {
    scanResults.totalPages = data.total;
    scanResults.scannedPages = data.current;
    
    const percentage = (data.current / data.total) * 100;
    progressFill.style.width = `${percentage}%`;
    progressCount.textContent = `${data.current}/${data.total}`;
    currentPage.textContent = `Scanning: ${data.url}`;
    
    addLog(data.message, 'progress');
}

/**
 * Handle individual page scan completion
 */
function handleScanComplete(data) {
    scanResults.totalViolations += data.violations;
    scanResults.totalRecommendations += data.recommendations;
    scanResults.totalManual += data.manual;
    scanResults.totalIssues = scanResults.totalViolations + scanResults.totalRecommendations;
    
    updateSummary();
    
    addLog(`✓ Completed: ${data.title} - Violations: ${data.violations}, Recommendations: ${data.recommendations}`, 'success');
}

/**
 * Handle all scans completion
 */
function handleAllComplete(data) {
    isScanning = false;
    runScanBtn.disabled = false;
    cancelScanBtn.disabled = true;
    updateConnectionStatus('connected');
    
    addLog(`Scan complete! ${data.successful}/${data.totalScanned} pages scanned successfully`, 'success');
    addLog('Downloading CSV report...', 'info');
    
    // Download CSV file
    downloadCSV(data.csvContent, `accessibility-report-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    
    addLog('✓ CSV report downloaded', 'success');
}

/**
 * Handle scan cancellation
 */
function handleCancelled(data) {
    resetScanUI();
    addLog(data.message, 'error');
}

/**
 * Update summary display
 */
function updateSummary() {
    summarySection.style.display = 'block';
    document.getElementById('total-violations').textContent = scanResults.totalViolations;
    document.getElementById('total-recommendations').textContent = scanResults.totalRecommendations;
    document.getElementById('total-manual').textContent = scanResults.totalManual;
    document.getElementById('total-issues').textContent = scanResults.totalIssues;
}

/**
 * Add log entry
 */
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${message}`;
    
    logs.appendChild(entry);
    logs.scrollTop = logs.scrollHeight;
}

/**
 * Clear logs
 */
function clearLogs() {
    logs.innerHTML = '';
}

/**
 * Download CSV file
 */
function downloadCSV(content, filename) {
    try {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        browser.downloads.download({
            url: url,
            filename: filename,
            saveAs: false
        }).then((downloadId) => {
            addLog(`CSV download started (ID: ${downloadId})`, 'success');
            URL.revokeObjectURL(url);
        }).catch((error) => {
            addLog(`Download error: ${error.message}`, 'error');
            // Fallback: try to trigger download via link
            fallbackDownload(content, filename);
        });
    } catch (error) {
        addLog(`CSV generation error: ${error.message}`, 'error');
        // Fallback: try to trigger download via link
        fallbackDownload(content, filename);
    }
}

/**
 * Fallback download method using anchor element
 */
function fallbackDownload(content, filename) {
    try {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addLog('CSV downloaded using fallback method', 'success');
    } catch (error) {
        addLog(`Fallback download failed: ${error.message}`, 'error');
    }
}

// Update URL when tab changes
browser.tabs.onActivated.addListener(() => {
    updateCurrentUrl();
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        updateCurrentUrl();
    }
});

// Made with Bob
