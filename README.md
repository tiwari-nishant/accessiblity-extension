# Accessibility CLI Scanner

Automated accessibility scanning tool for web applications using IBM's accessibility-checker. This tool automatically discovers and scans all routes on your web application, storing all scan results that can be viewed through the built-in reports.

**NEW**: Now includes a Firefox browser extension for easy scanning directly from your browser!

## Features

- 🔍 **Automatic Route Discovery**: Crawls your website to find all accessible routes
- 📊 **Comprehensive Scanning**: Uses IBM Accessibility Checker to scan each page
- 📁 **Automated Storage**: All scans are automatically stored in the results directory
- 🎯 **Configurable**: Customize scanning depth, policies, and output formats
- 📸 **Screenshot Capture**: Captures screenshots of pages with violations
- 🔄 **Multiple Formats**: Built-in HTML and JSON reports for each scan

## Prerequisites

- Node.js (v14 or higher)
- A running web application on `localhost:8000` (or configure a different URL)

## Installation

1. Install dependencies:
```bash
npm install
```

## Configuration

### Basic Configuration

The scanner is pre-configured to scan `http://localhost:8000`. To change the base URL, edit [`scan.js`](scan.js:11):

```javascript
const BASE_URL = 'http://localhost:8000'; // Change this to your URL
const MAX_DEPTH = 3; // Maximum crawl depth
```

### Advanced Configuration

Customize the accessibility checker settings in [`.achecker.yml`](.achecker.yml:1):

- **Policies**: Choose which accessibility standards to test against (IBM_Accessibility, WCAG 2.1, etc.)
- **Report Levels**: Configure which issue types to include
- **Output Formats**: Choose between JSON, HTML, CSV
- **Screenshots**: Enable/disable screenshot capture

## Usage

### Option 1: Browser Extension (Recommended)

Use the Firefox browser extension for the easiest scanning experience:

1. **Start the WebSocket server**:
```bash
npm run server
```

2. **Install the extension** (see [`browser-extension/README.md`](browser-extension/README.md))

3. **Navigate to your BMC page** (must contain "localhost" or "stglabs" in URL)

4. **Open the extension sidebar** and click "Run Scan"

5. **CSV report downloads automatically** when scan completes

See the [Browser Extension Documentation](browser-extension/README.md) for detailed instructions.

### Option 2: Command Line

Make sure your web application is running on `localhost:8000`, then execute:

```bash
npm run scan
```

Or directly:

```bash
node scan.js
```

### Built-in Excel Report

The accessibility-checker automatically generates Excel reports when you run scans:
- Configured in [`.achecker.yml`](.achecker.yml:14) with `outputFormat: xlsx`
- Excel files are created in the [`results/`](results/) directory
- Each scan generates its own Excel report
- Use `getComplianceHelper()` for consolidated reports

### Custom Excel Report (Optional)

You can also generate a custom consolidated Excel report:

```bash
npm run report
```

This creates a custom `accessibility-report.xlsx` with additional analysis sheets.

### What Happens During a Scan

1. **Discovery Phase**: The scanner starts at the base URL and discovers all internal links
2. **Scanning Phase**: Each discovered page is scanned for accessibility issues
3. **Report Generation**: A consolidated report is generated with all findings

### Output Files

After scanning, you'll find:

- **`results/`**: Directory containing all scan results
  - Individual HTML reports for each scanned page
  - Individual JSON reports for each scanned page
  - Screenshots of pages with violations (if enabled)
- **`accessibility-summary.json`**: JSON file with overall statistics
- **`accessibility-report.xlsx`**: Excel report (generated with `npm run report`)

## Understanding the Reports

The accessibility-checker generates detailed reports for each scanned page:

### Individual Page Reports (HTML)
Each HTML report in the `results/` directory includes:
- Page title and URL
- Issue counts by severity
- Detailed list of all issues found
- Rule IDs with links to documentation
- DOM paths to problematic elements
- Help text and remediation guidance

### Summary Statistics (JSON)
The `accessibility-summary.json` file provides:
- Overall violation counts across all pages
- List of all scanned pages with their results
- Success/failure status for each scan
- Timestamps for tracking

### Issue Severity Levels

- 🔴 **Violation**: Definite accessibility issue that must be fixed
- 🟡 **Potential Violation**: Likely issue that needs review
- 🔵 **Recommendation**: Suggestion for improvement
- ⚪ **Manual**: Requires manual verification

## Customization

### Adding/Removing Routes

Edit the [`ROUTES_TO_SCAN`](scan.js:23) array in [`scan.js`](scan.js:23):

```javascript
const ROUTES_TO_SCAN = [
    '/',
    '/login',
    '/dashboard',
    '/settings',
    '/profile',
    // Add or remove routes as needed
];
```

### Disabling Authentication

If your application doesn't require login, set in [`scan.js`](scan.js:12):

```javascript
const AUTH_CONFIG = {
    enabled: false, // Disable authentication
    // ... rest of config
};
```

### Viewing All Reports

The accessibility-checker stores all scans in the `results/` directory:

1. **Individual Reports**: Open any HTML file in the `results/` directory
2. **Browse All Reports**: Navigate through the `results/` folder to see all scans
3. **JSON Data**: Use the JSON files for programmatic access or custom reporting

### Changing Accessibility Policies

Edit [`.achecker.yml`](.achecker.yml:7) to test against different standards:

```yaml
policies:
  - IBM_Accessibility
  - WCAG_2_1
  - WCAG_2_2
```

## Troubleshooting

### "Connection Refused" Error

Make sure your web application is running on the configured port:
```bash
# Check if your app is running
curl https://localhost:8000
```

### Authentication Issues

If login fails:
1. **Check credentials**: Verify username and password in [`AUTH_CONFIG`](scan.js:12)
2. **Verify selectors**: Inspect your login form and update CSS selectors
3. **Check console output**: Look for specific error messages
4. **Test manually**: Try logging in through a browser first
5. **Disable if not needed**: Set `AUTH_CONFIG.enabled = false`

### Pages Redirecting to Login

If scanned pages show `/login` in the URL:
- Authentication is required but may have failed
- Check that [`AUTH_CONFIG`](scan.js:12) is properly configured
- Verify the `successIndicator` selector if specified

### Timeout Issues

For slow-loading pages, increase the timeout in [`scan.js`](scan.js:124):

```javascript
await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000 // Increase to 60 seconds
});
```

### Memory Issues

For large sites, you may need to increase Node.js memory:

```bash
node --max-old-space-size=4096 scan.js
```

## Best Practices

1. **Run Regular Scans**: Integrate into your CI/CD pipeline
2. **Fix Violations First**: Prioritize definite violations over recommendations
3. **Review Potential Issues**: Many potential violations are actual issues
4. **Manual Testing**: Always perform manual accessibility testing alongside automated scans
5. **Incremental Fixes**: Address issues page by page or by severity

## IBM Accessibility Checker

This tool uses the [IBM Equal Access Accessibility Checker](https://www.npmjs.com/package/accessibility-checker), which:

- Tests against WCAG 2.1 and IBM Accessibility standards
- Automatically generates HTML and JSON reports
- Provides detailed rule explanations with links to documentation
- Offers remediation guidance
- Captures screenshots of violations
- Supports baseline comparison for tracking improvements

## Resources

- [IBM Equal Access Toolkit](https://www.ibm.com/able/toolkit)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibility Checker Documentation](https://github.com/IBMa/equal-access/tree/master/accessibility-checker)

## License

ISC

## Support

For issues with:
- **This scanner**: Check the troubleshooting section above
- **IBM Accessibility Checker**: Visit the [GitHub repository](https://github.com/IBMa/equal-access)
- **Accessibility questions**: Consult [W3C WAI resources](https://www.w3.org/WAI/)