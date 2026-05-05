# Accessibility Scanner Browser Extension

A Firefox browser extension that integrates with the accessibility-cli to perform automated accessibility scans on BMC web interfaces.

## Features

✅ **Sidebar Interface** - Clean sidebar UI instead of popup  
✅ **URL Validation** - Only works on localhost or stglabs URLs  
✅ **Real-time Progress** - Live scan progress updates  
✅ **Automatic CSV Export** - Downloads CSV report automatically after scan  
✅ **Cancel Functionality** - Stop scans in progress  
✅ **Scan Logs** - Detailed logging of scan progress  

## Prerequisites

1. **Node.js** installed on your system
2. **WebSocket Server** running (from the main accessibility-cli project)
3. **Firefox Browser**

## Installation

### Step 1: Create Extension Icons

Before installing, you need to create icon files:

```bash
cd browser-extension/icons
```

Create two PNG files:
- `icon-48.png` (48x48 pixels)
- `icon-96.png` (96x96 pixels)

See [`icons/create-icons.md`](icons/create-icons.md) for detailed instructions.

### Step 2: Install Extension in Firefox

1. Open Firefox
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the `browser-extension` folder
5. Select the `manifest.json` file
6. The extension will be installed temporarily

**Note**: Temporary extensions are removed when Firefox closes. For permanent installation, you'll need to package and sign the extension.

## Usage

### Step 1: Start the WebSocket Server

From the main project directory:

```bash
npm run server
```

The server will start on `ws://localhost:8080`

### Step 2: Navigate to BMC Page

Open Firefox and navigate to a page containing:
- `localhost` in the URL, OR
- `stglabs` in the URL

Example: `https://localhost:8000` or `https://stglabs.example.com`

### Step 3: Open the Extension Sidebar

Click the extension icon in the Firefox toolbar, or:
- Press `Ctrl+Shift+Y` (Windows/Linux)
- Press `Cmd+Shift+Y` (Mac)

### Step 4: Run Scan

1. Verify the connection status shows "Connected" (green dot)
2. Verify your current URL is displayed
3. Click the "Run Scan" button
4. Monitor progress in real-time:
   - Progress bar shows completion percentage
   - Current page being scanned is displayed
   - Logs show detailed scan information
5. Wait for scan to complete
6. CSV report will download automatically

### Step 5: Review Results

- **Summary Cards**: View total violations, recommendations, and manual checks
- **Scan Logs**: Review detailed scan information
- **CSV Report**: Open the downloaded CSV file for complete results

## Features in Detail

### URL Validation

The extension validates the current tab URL before allowing scans:
- ✅ Must contain "localhost" OR "stglabs"
- ❌ If invalid, shows alert: "Please be on the BMC overview page"

### Real-time Progress

During scanning:
- Progress bar updates with each page scanned
- Current page URL is displayed
- Page count shows (e.g., "5/32")
- Summary cards update in real-time

### Cancel Scan

- Click "Cancel Scan" button to stop an in-progress scan
- Browser closes gracefully
- Partial results are not exported

### CSV Export

After successful scan completion:
- CSV file downloads automatically to your Downloads folder
- Filename format: `accessibility-report-YYYY-MM-DDTHH-MM-SS.csv`
- Contains all scan results and summary

## Troubleshooting

### "Disconnected" Status

**Problem**: Extension shows "Disconnected" status

**Solution**:
1. Make sure the WebSocket server is running: `npm run server`
2. Check that the server is on port 8080
3. Refresh the extension sidebar

### "Run Scan" Button Disabled

**Problem**: Cannot click the Run Scan button

**Possible Causes**:
1. Not connected to server (see above)
2. Invalid URL (must contain "localhost" or "stglabs")
3. Scan already in progress

### No CSV Download

**Problem**: Scan completes but no CSV file downloads

**Solution**:
1. Check Firefox download permissions
2. Check browser console for errors (F12)
3. Verify Downloads folder permissions

### Extension Not Loading

**Problem**: Extension doesn't appear after installation

**Solution**:
1. Verify `manifest.json` is valid
2. Check that icon files exist in `icons/` folder
3. Look for errors in `about:debugging`

## Development

### File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background script
├── icons/                 # Extension icons
│   ├── icon-48.png
│   ├── icon-96.png
│   └── create-icons.md
└── sidebar/              # Sidebar UI
    ├── sidebar.html      # UI structure
    ├── sidebar.css       # Styling
    └── sidebar.js        # Logic and WebSocket communication
```

### WebSocket Protocol

The extension communicates with the server using JSON messages:

**Client → Server**:
```json
{
  "type": "start-scan",
  "baseUrl": "https://localhost:8000"
}
```

```json
{
  "type": "cancel-scan"
}
```

**Server → Client**:
```json
{
  "type": "progress",
  "current": 5,
  "total": 32,
  "url": "https://localhost:8000/#/dashboard",
  "message": "Scanning page 5/32..."
}
```

```json
{
  "type": "complete",
  "totalScanned": 32,
  "successful": 32,
  "csvContent": "..."
}
```

## Limitations

1. **Temporary Installation**: Extension is removed when Firefox closes
2. **Firefox Only**: Currently only supports Firefox (uses Firefox-specific APIs)
3. **Local Server Required**: Requires WebSocket server running locally
4. **URL Restrictions**: Only works on localhost or stglabs URLs

## Future Enhancements

- [ ] Chrome/Edge support
- [ ] Permanent installation (signed extension)
- [ ] Configurable server URL
- [ ] Export to multiple formats (JSON, HTML)
- [ ] Scan history
- [ ] Custom route configuration

## Support

For issues or questions:
1. Check the main project README
2. Verify WebSocket server is running
3. Check browser console for errors
4. Review server logs

## License

ISC