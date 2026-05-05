const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');

// Configuration
const RESULTS_DIR = './results';
const EXCEL_REPORT = './accessibility-report.xlsx';

/**
 * Read all JSON scan results from the results directory
 */
async function readAllScanResults() {
    console.log('Reading scan results from:', RESULTS_DIR);
    
    try {
        const files = await fs.readdir(RESULTS_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        console.log(`Found ${jsonFiles.length} JSON scan files`);
        
        const allResults = [];
        
        for (const file of jsonFiles) {
            const filePath = path.join(RESULTS_DIR, file);
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            allResults.push({
                filename: file,
                data: data
            });
        }
        
        return allResults;
    } catch (error) {
        console.error('Error reading scan results:', error.message);
        return [];
    }
}

/**
 * Extract issues from scan results
 */
function extractIssues(scanResults) {
    const issues = [];
    
    for (const scan of scanResults) {
        const report = scan.data.report;
        if (!report || !report.results) continue;
        
        const pageUrl = report.pageURL || 'Unknown';
        const pageTitle = report.pageTitle || 'Unknown';
        const scanLabel = report.label || scan.filename;
        
        for (const result of report.results) {
            issues.push({
                'Scan Label': scanLabel,
                'Page URL': pageUrl,
                'Page Title': pageTitle,
                'Issue Level': result.level || 'unknown',
                'Rule ID': result.ruleId || 'unknown',
                'Message': result.message || '',
                'Help': result.help || '',
                'Element': result.path?.dom || '',
                'Snippet': result.snippet || '',
                'Category': result.category || '',
                'Checkpoint': result.checkpoint || '',
                'Reasoned': result.reasonId || ''
            });
        }
    }
    
    return issues;
}

/**
 * Generate summary statistics
 */
function generateSummary(scanResults) {
    const summary = [];
    
    for (const scan of scanResults) {
        const report = scan.data.report;
        if (!report) continue;
        
        const pageUrl = report.pageURL || 'Unknown';
        const pageTitle = report.pageTitle || 'Unknown';
        const scanLabel = report.label || scan.filename;
        const counts = report.summary?.counts || {};
        
        summary.push({
            'Scan Label': scanLabel,
            'Page URL': pageUrl,
            'Page Title': pageTitle,
            'Violations': counts.violation || 0,
            'Recommendations': counts.recommendation || 0,
            'Manual Checks': counts.manual || 0,
            'Total Issues': (counts.violation || 0) + (counts.recommendation || 0),
            'Scan Date': report.scanTime || 'Unknown'
        });
    }
    
    return summary;
}

/**
 * Generate overall statistics
 */
function generateOverallStats(scanResults) {
    let totalViolations = 0;
    let totalRecommendations = 0;
    let totalManual = 0;
    let totalPages = scanResults.length;
    
    for (const scan of scanResults) {
        const counts = scan.data.report?.summary?.counts || {};
        totalViolations += counts.violation || 0;
        totalRecommendations += counts.recommendation || 0;
        totalManual += counts.manual || 0;
    }
    
    return [{
        'Metric': 'Total Pages Scanned',
        'Count': totalPages
    }, {
        'Metric': 'Total Violations',
        'Count': totalViolations
    }, {
        'Metric': 'Total Recommendations',
        'Count': totalRecommendations
    }, {
        'Metric': 'Total Manual Checks',
        'Count': totalManual
    }, {
        'Metric': 'Total Issues',
        'Count': totalViolations + totalRecommendations
    }, {
        'Metric': 'Report Generated',
        'Count': new Date().toLocaleString()
    }];
}

/**
 * Generate violations by rule
 */
function generateViolationsByRule(scanResults) {
    const ruleMap = new Map();
    
    for (const scan of scanResults) {
        const report = scan.data.report;
        if (!report || !report.results) continue;
        
        for (const result of report.results) {
            if (result.level === 'violation') {
                const ruleId = result.ruleId || 'unknown';
                if (!ruleMap.has(ruleId)) {
                    ruleMap.set(ruleId, {
                        'Rule ID': ruleId,
                        'Message': result.message || '',
                        'Help': result.help || '',
                        'Count': 0,
                        'Category': result.category || ''
                    });
                }
                ruleMap.get(ruleId).Count++;
            }
        }
    }
    
    return Array.from(ruleMap.values()).sort((a, b) => b.Count - a.Count);
}

/**
 * Generate Excel report
 */
async function generateExcelReport() {
    console.log('='.repeat(60));
    console.log('Accessibility Report Generator');
    console.log('='.repeat(60));
    
    // Read all scan results
    const scanResults = await readAllScanResults();
    
    if (scanResults.length === 0) {
        console.error('No scan results found. Please run scans first using: npm run scan');
        return;
    }
    
    console.log(`Processing ${scanResults.length} scan results...`);
    
    // Generate data for different sheets
    const overallStats = generateOverallStats(scanResults);
    const summary = generateSummary(scanResults);
    const issues = extractIssues(scanResults);
    const violationsByRule = generateViolationsByRule(scanResults);
    
    console.log(`Extracted ${issues.length} total issues`);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Add Overall Statistics sheet
    const statsSheet = XLSX.utils.json_to_sheet(overallStats);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Overall Statistics');
    
    // Add Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary by Page');
    
    // Add All Issues sheet
    const issuesSheet = XLSX.utils.json_to_sheet(issues);
    XLSX.utils.book_append_sheet(workbook, issuesSheet, 'All Issues');
    
    // Add Violations by Rule sheet
    const violationsSheet = XLSX.utils.json_to_sheet(violationsByRule);
    XLSX.utils.book_append_sheet(workbook, violationsSheet, 'Violations by Rule');
    
    // Filter sheets by issue level
    const violations = issues.filter(i => i['Issue Level'] === 'violation');
    const potentialViolations = issues.filter(i => i['Issue Level'] === 'potentialviolation');
    const recommendations = issues.filter(i => i['Issue Level'] === 'recommendation');
    
    if (violations.length > 0) {
        const violationsOnlySheet = XLSX.utils.json_to_sheet(violations);
        XLSX.utils.book_append_sheet(workbook, violationsOnlySheet, 'Violations Only');
    }
    
    if (potentialViolations.length > 0) {
        const potentialSheet = XLSX.utils.json_to_sheet(potentialViolations);
        XLSX.utils.book_append_sheet(workbook, potentialSheet, 'Potential Violations');
    }
    
    if (recommendations.length > 0) {
        const recommendationsSheet = XLSX.utils.json_to_sheet(recommendations);
        XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Recommendations');
    }
    
    // Write to file
    XLSX.writeFile(workbook, EXCEL_REPORT);
    
    console.log('='.repeat(60));
    console.log('✅ Excel report generated successfully!');
    console.log(`📊 Report saved to: ${EXCEL_REPORT}`);
    console.log('='.repeat(60));
    console.log('\nReport Contents:');
    console.log(`  • Overall Statistics: Summary metrics`);
    console.log(`  • Summary by Page: ${summary.length} pages`);
    console.log(`  • All Issues: ${issues.length} total issues`);
    console.log(`  • Violations by Rule: ${violationsByRule.length} unique rules`);
    if (violations.length > 0) console.log(`  • Violations Only: ${violations.length} violations`);
    if (potentialViolations.length > 0) console.log(`  • Potential Violations: ${potentialViolations.length} issues`);
    if (recommendations.length > 0) console.log(`  • Recommendations: ${recommendations.length} recommendations`);
    console.log('='.repeat(60));
}

// Run the report generator
generateExcelReport().catch(error => {
    console.error('Error generating report:', error);
    process.exit(1);
});

// Made with Bob
