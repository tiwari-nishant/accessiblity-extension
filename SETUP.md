# Accessibility Scanner Extension - Complete Setup Guide

This guide will walk you through setting up the Accessibility Scanner Extension from scratch, including the Node.js backend and Firefox browser extension.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Part 1: Backend Setup](#part-1-backend-setup)
- [Part 2: Browser Extension Setup](#part-2-browser-extension-setup)
- [Part 3: Usage](#part-3-usage)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Firefox Browser** - [Download here](https://www.mozilla.org/firefox/)
- **Git** (optional, for cloning) - [Download here](https://git-scm.com/)

### Verify Installation

Open a terminal and run:

```bash
node --version
npm --version
```

You should see version numbers for both commands.

---

## Part 1: Backend Setup

### Step 1: Create Project Directory

```bash
# Create a new directory for the project
mkdir accessibility-scanner
cd accessibility-scanner
```

### Step 2: Initialize Node.js Project

```bash
# Initialize package.json
npm init -y
```

### Step 3: Install Dependencies

```bash
# Install required packages
npm install accessibility-checker puppeteer ws exceljs
```

This will install:
- `accessibility-checker` - IBM's accessibility testing tool
- `puppeteer` - Headless browser automation
- `ws` - WebSocket server for browser extension communication
- `exceljs` - Excel report generation

### Step 4: Create Configuration Files

#### Create `.achecker.yml`

Create a file named `.achecker.yml` in the project root:

```yaml
# Accessibility Checker Configuration
policies:
  - IBM_Accessibility

reportLevels:
  - violation
  - recommendation
  - manual

outputFormat:
  - json
  - html
  - csv
  - xlsx

outputFolder: results
outputFilenameTimestamp: false

label:
  - OpenBMC-Web-UI
```

#### Create `.gitignore`

Create a file named `.gitignore`:

```
node_modules/
results/
*.log
.DS_Store
```

### Step 5: Create Backend Scripts

#### Create `scan.js`

Download or create [`scan.js`](scan.js:1) - the main CLI scanning script.

#### Create `websocket-server.js`

Download or create [`websocket-server.js`](websocket-server.js:1) - the WebSocket server for browser extension.

#### Create `generate-report.js`

Download or create [`generate-report.js`](generate-report.js:1) - Excel report generation utility.

### Step 6: Update package.json Scripts

Edit your `package.json` and add these scripts:

```json
{
  "scripts": {
    "scan": "node scan.js",
    "server": "node websocket-server.js",
    "report": "node generate-report.js"
  }
}
```

### Step 7: Test Backend Installation

```bash
# Test the WebSocket server
npm run server
```

You should see:
```
WebSocket server running on ws://localhost:8080
Waiting for browser extension to connect...
```

Keep this terminal open. Open a new terminal for the next steps.

---

## Part 2: Browser Extension Setup

### Step 1: Create Extension Directory Structure

In your project root, create the browser extension structure:

```bash
mkdir -p browser-extension/sidebar
mkdir -p browser-extension/icons
```

### Step 2: Create Extension Files

#### Create `browser-extension/manifest.json`

```json
{
  "manifest_version": 2,
  "name": "Accessibility Scanner",
  "version": "1.0.0",
  "description": "Automated accessibility scanning for web applications",
  
  "permissions": [
    "activeTab",
    "tabs",
    "downloads",
    "<all_urls>"
  ],
  
  "background": {
    "scripts": ["background.js"]
  },
  
  "sidebar_action": {
    "default_title": "Accessibility Scanner",
    "default_panel": "sidebar/sidebar.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  },
  
  "browser_action": {
    "default_title": "Open Accessibility Scanner",
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    }
  },
  
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

#### Create `browser-extension/background.js`

```javascript
// Open sidebar when browser action is clicked
browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();
});
```

#### Create `browser-extension/sidebar/sidebar.html`

Download or create [`browser-extension/sidebar/sidebar.html`](browser-extension/sidebar/sidebar.html:1)

#### Create `browser-extension/sidebar/sidebar.css`

Download or create [`browser-extension/sidebar/sidebar.css`](browser-extension/sidebar/sidebar.css:1)

#### Create `browser-extension/sidebar/sidebar.js`

Download or create [`browser-extension/sidebar/sidebar.js`](browser-extension/sidebar/sidebar.js:1)

### Step 3: Create Extension Icons

You need to create icon files in the `browser-extension/icons/` directory:
- `icon-16.png` (16x16 pixels)
- `icon-32.png` (32x32 pixels)
- `icon-48.png` (48x48 pixels)
- `icon-128.png` (128x128 pixels)

**Quick Icon Creation:**

You can use any image editor or online tool to create simple icons. For testing, you can use placeholder icons from [placeholder.com](https://placeholder.com/) or create them using this simple method:

1. Create a simple colored square in any image editor
2. Add text "A11y" or an accessibility symbol
3. Export in the required sizes

### Step 4: Load Extension in Firefox

1. **Open Firefox**

2. **Navigate to** `about:debugging#/runtime/this-firefox`

3. **Click** "Load Temporary Add-on..."

4. **Navigate to** your `browser-extension` folder

5. **Select** the `manifest.json` file

6. **Click** "Open"

The extension should now appear in your Firefox extensions list!

### Step 5: Open the Extension Sidebar

1. **Click** the extension icon in the Firefox toolbar (or press `Ctrl+B` / `Cmd+B`)
2. The sidebar should open on the left side of the browser
3. You should see "Accessibility Scanner" interface

---

## Part 3: Usage

### Using the Browser Extension

1. **Start the WebSocket Server**
   ```bash
   npm run server
   ```
   Keep this running in a terminal.

2. **Open Your Web Application**
   - Navigate to your localhost application (e.g., `http://localhost:8000`)
   - The URL must contain "localhost" or "stglabs"

3. **Open the Extension Sidebar**
   - Click the extension icon or press `Ctrl+B` / `Cmd+B`
   - The sidebar should show "Connected" status

4. **Run a Scan**
   - Click the "Run Scan" button
   - Watch the progress as it scans all configured routes
   - View real-time logs and statistics

5. **View Reports**
   - After scan completes, check the `results/` directory
   - Reports are available in multiple formats:
     - HTML (visual report)
     - JSON (raw data)
     - CSV (spreadsheet-friendly)
     - XLSX (Excel format)

### Using the CLI Scanner

For standalone scanning without the browser extension:

```bash
npm run scan
```

This will:
- Scan all configured routes
- Generate reports in the `results/` directory
- Display progress in the terminal

### Generating Excel Reports

To create a consolidated Excel report from scan results:

```bash
npm run report
```

---

## Troubleshooting

### Backend Issues

**Problem: "Cannot find module 'accessibility-checker'"**
```bash
# Solution: Reinstall dependencies
npm install
```

**Problem: "Port 8080 already in use"**
```bash
# Solution: Kill the process using port 8080
# On macOS/Linux:
lsof -ti:8080 | xargs kill -9

# On Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Problem: WebSocket server not connecting**
- Ensure the server is running (`npm run server`)
- Check that no firewall is blocking port 8080
- Verify the server shows "WebSocket server running on ws://localhost:8080"

### Browser Extension Issues

**Problem: Extension not loading**
- Verify all files are in the correct directories
- Check browser console for errors (`F12` → Console)
- Ensure `manifest.json` is valid JSON (use a JSON validator)

**Problem: "Disconnected from server"**
- Start the WebSocket server: `npm run server`
- Refresh the extension sidebar
- Check browser console for connection errors

**Problem: "Invalid URL" error**
- Ensure you're on a page with "localhost" or "stglabs" in the URL
- The extension only works with these domains for security

**Problem: Icons not showing**
- Create placeholder icons in the `icons/` directory
- Ensure icon files are named correctly (icon-16.png, etc.)
- Reload the extension after adding icons

### Scan Issues

**Problem: Scans timing out**
- Increase timeout in `websocket-server.js` (line ~150)
- Check if the target website is accessible
- Verify authentication credentials if required

**Problem: No reports generated**
- Check the `results/` directory exists
- Verify `.achecker.yml` configuration
- Look for errors in the server terminal

**Problem: Authentication failing**
- Update login selectors in `websocket-server.js`
- Verify credentials are correct
- Check if login page structure has changed

---

## Configuration

### Customizing Routes to Scan

Edit `websocket-server.js` and modify the `ROUTES_TO_SCAN` array (around line 26):

```javascript
const ROUTES_TO_SCAN = [
    '/your-route-1',
    '/your-route-2',
    '/your-route-3',
    // Add more routes...
];
```

### Customizing Authentication

Edit `websocket-server.js` and update the login configuration (around line 100):

```javascript
const LOGIN_CONFIG = {
    url: 'http://localhost:8000/#/login',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: 'button[type="submit"]',
    username: 'your-username',
    password: 'your-password'
};
```

### Customizing Accessibility Rules

Edit `.achecker.yml` to change:
- Policies (IBM_Accessibility, WCAG_2_1, etc.)
- Report levels (violation, recommendation, manual, potential)
- Output formats (json, html, csv, xlsx)

---

## Project Structure

```
accessibility-scanner/
├── .achecker.yml              # Accessibility checker configuration
├── .gitignore                 # Git ignore file
├── package.json               # Node.js dependencies
├── scan.js                    # CLI scanning script
├── websocket-server.js        # WebSocket server for extension
├── generate-report.js         # Excel report generator
├── SETUP.md                   # This file
├── README.md                  # Project documentation
├── browser-extension/         # Firefox extension
│   ├── manifest.json          # Extension manifest
│   ├── background.js          # Background script
│   ├── icons/                 # Extension icons
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── sidebar/               # Sidebar UI
│       ├── sidebar.html       # Sidebar HTML
│       ├── sidebar.css        # Sidebar styles
│       └── sidebar.js         # Sidebar logic
└── results/                   # Generated reports (created automatically)
    ├── *.html                 # HTML reports
    ├── *.json                 # JSON reports
    ├── *.csv                  # CSV reports
    └── *.xlsx                 # Excel reports
```

---

## Next Steps

1. **Customize Routes**: Update the routes in `websocket-server.js` to match your application
2. **Configure Authentication**: Set up login credentials if your app requires authentication
3. **Run Your First Scan**: Start the server and use the extension to scan your application
4. **Review Reports**: Check the `results/` directory for detailed accessibility reports
5. **Integrate into CI/CD**: Use the CLI scanner in your automated testing pipeline

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [IBM Accessibility Checker documentation](https://www.npmjs.com/package/accessibility-checker)
3. Check browser console for errors (F12)
4. Review server terminal logs

---

## License

This project uses the IBM Accessibility Checker, which is licensed under Apache 2.0.