# Accessibility Scanner Extension - Installation Guide

Quick guide to install and use the Accessibility Scanner browser extension for Mac and Windows users.

---

## 📋 Prerequisites

Before installing the extension, ensure you have:

1. **Firefox Browser** - [Download here](https://www.mozilla.org/firefox/)
2. **Access to the Git repository** containing the extension files

---

## 🔽 Download the Extension

### Option 1: Download ZIP (Easiest)

1. Go to the GitHub repository
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the ZIP file to a location you'll remember

**Mac:** Double-click the ZIP file to extract
**Windows:** Right-click → "Extract All..."

### Option 2: Clone with Git

If you have Git installed:

**Mac (Terminal):**
```bash
cd ~/Documents
git clone https://github.com/your-username/accessibility-scanner.git
```

**Windows (Command Prompt):**
```bash
cd %USERPROFILE%\Documents
git clone https://github.com/your-username/accessibility-scanner.git
```

---

## 🦊 Install Extension in Firefox

### Step 1: Open Firefox Extension Debugging Page

1. Open **Firefox**
2. In the address bar, type: `about:debugging#/runtime/this-firefox`
3. Press **Enter**

### Step 2: Load the Extension

1. Click the **"Load Temporary Add-on..."** button

2. Navigate to where you downloaded/extracted the files

3. Open the **`browser-extension`** folder

4. Select the **`manifest.json`** file

5. Click **"Open"**

### Step 3: Verify Installation

✅ You should see **"Accessibility Scanner"** appear in the list of temporary extensions

---

## 🚀 Using the Extension

### Step 1: Open the Extension Sidebar

**Option A:** Click the extension icon in the Firefox toolbar

**Option B:** Press keyboard shortcut:
- **Mac:** `Cmd + B`
- **Windows:** `Ctrl + B`

The sidebar will open on the left side of your browser.

### Step 2: Navigate to Your Application

1. Open your web application in Firefox (e.g., `http://localhost:8000`)
2. **Important:** The URL must contain **"localhost"** or **"stglabs"**

### Step 3: Connect to Server

The extension requires a backend server to be running. You should see:
- 🟢 **"Connected"** - Ready to scan
- 🔴 **"Disconnected"** - Server not running 
    - run `npm run server` to start the server

### Step 4: Run a Scan

1. Click the **"Run Scan"** button
2. Watch the progress bar as it scans all routes
3. View real-time logs and statistics in the sidebar

### Step 5: View Results

After the scan completes:
- Check the **`results/`** folder on the server for detailed reports
- Reports are available in multiple formats: HTML, JSON, CSV, and XLSX

---

## 🔧 Troubleshooting

### ❌ Extension Not Loading

**Problem:** Extension doesn't appear after loading

**Solution:**
1. Verify you selected the `manifest.json` file inside the `browser-extension` folder
2. Check for error messages in the Firefox console (press `F12`)
3. Try reloading: Go to `about:debugging#/runtime/this-firefox` → Click "Reload"

---

### ❌ "Disconnected from Server"

**Problem:** Extension shows red "Disconnected" status

**Solution:**
1. The backend server is not running
2. Contact your system administrator or team lead
3. If you're the administrator, start the server with: `npm run server`

---

### ❌ "Invalid URL" Error

**Problem:** Can't run scan, shows "Invalid URL" message

**Solution:**
- The extension only works with URLs containing **"localhost"** or **"stglabs"**
- ✅ Valid: `http://localhost:8000`, `http://localhost:3000/dashboard`
- ✅ Valid: `https://stglabs.example.com`
- ❌ Invalid: `http://127.0.0.1:8000`, `https://example.com`

**Fix:** Use `localhost` instead of `127.0.0.1` in your URL

---

### ❌ Extension Icon Not Showing

**Problem:** Can't find the extension icon in toolbar

**Solution:**
1. The extension is loaded as a temporary add-on
2. Look for the extension icon in the Firefox toolbar
3. Alternatively, use keyboard shortcut: `Cmd + B` (Mac) or `Ctrl + B` (Windows)
4. Or go to `about:debugging#/runtime/this-firefox` to verify it's loaded

---

### ❌ Scan Not Starting

**Problem:** Click "Run Scan" but nothing happens

**Solution:**
1. Ensure you're on a valid URL (containing "localhost" or "stglabs")
2. Check that status shows "Connected" (green)
3. Look for error messages in the logs section
4. Try refreshing the page and reopening the sidebar

---

## 📝 Important Notes

### Temporary Extension

⚠️ **The extension is loaded as "temporary"** which means:
- It will be **removed when you close Firefox**
- You'll need to **reload it** each time you restart Firefox
- This is normal for development/testing extensions

### Reloading the Extension

To reload after restarting Firefox:
1. Open Firefox
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **"Load Temporary Add-on..."**
4. Select `browser-extension/manifest.json`
5. Click **"Open"**

### Updating the Extension

If the extension is updated:
1. Download/pull the latest version
2. Go to `about:debugging#/runtime/this-firefox`
3. Find "Accessibility Scanner" in the list
4. Click **"Reload"** button next to it

---

## 🎯 Quick Reference

### Installation Steps (Summary)

1. Download extension files from repository
2. Open Firefox → `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select `browser-extension/manifest.json`
5. Open sidebar: Click icon or press `Cmd + B` / `Ctrl + B`

### Using the Extension (Summary)

1. Navigate to your application (URL must contain "localhost" or "stglabs")
2. Open extension sidebar
3. Verify "Connected" status
4. Click "Run Scan"
5. View results in `results/` folder on server

### Keyboard Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Open Sidebar | `Cmd + B` | `Ctrl + B` |
| Open DevTools | `Cmd + Option + I` | `F12` |

---

## 📂 File Structure

After downloading, you should have:

```
accessibility-scanner/
└── browser-extension/          ← This is what you need
    ├── manifest.json           ← Select this file when loading
    ├── background.js
    ├── icons/
    │   ├── icon-16.png
    │   ├── icon-32.png
    │   ├── icon-48.png
    │   └── icon-128.png
    └── sidebar/
        ├── sidebar.html
        ├── sidebar.css
        └── sidebar.js
```

---

## ❓ Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Press `F12` in Firefox to check for error messages
3. Contact your system administrator or team lead
4. Verify you're using the latest version of Firefox

---

## 🔒 Privacy & Security

- The extension only works with "localhost" and "stglabs" domains
- It requires a connection to a local WebSocket server
- No data is sent to external servers
- All scanning is performed locally

---

**Happy Scanning! 🚀**

For detailed setup information including server configuration, see [SETUP.md](SETUP.md)