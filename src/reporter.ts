import * as path from 'path';
import * as fs from 'fs';
import { AnalysisResult, FileMetrics, TestMetrics } from './analyzer';

export interface ReportOptions {
  format: 'text' | 'json' | 'html';
  verbose: boolean;
  baseDir: string;
  threshold: number;
  outputPath?: string;
}

/**
 * Get relative path for cleaner output
 */
function relativePath(filePath: string, baseDir: string): string {
  return path.relative(baseDir, filePath);
}

/**
 * Get grade from score
 */
function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get colored score (ANSI colors)
 */
function coloredScore(score: number): string {
  if (score >= 80) return `\x1b[32m${score}\x1b[0m`; // Green
  if (score >= 60) return `\x1b[33m${score}\x1b[0m`; // Yellow
  return `\x1b[31m${score}\x1b[0m`; // Red
}

/**
 * Generate text report
 */
function generateTextReport(result: AnalysisResult, options: ReportOptions): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    TEST READABILITY SCORE                      ');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Overall Summary
  const grade = getGrade(result.overallScore);
  lines.push(`📊 Overall Score: ${coloredScore(result.overallScore)}/100 (Grade: ${grade})`);
  lines.push(`   Files analyzed: ${result.totalFiles}`);
  lines.push(`   Tests analyzed: ${result.totalTests}`);
  lines.push('');

  if (result.files.length === 0) {
    lines.push('No test files found!');
    return lines.join('\n');
  }

  // Sort files by score (lowest first)
  const sortedFiles = [...result.files].sort((a, b) => a.fileScore - b.fileScore);

  // Files needing attention
  const belowThreshold = sortedFiles.filter(f => f.fileScore < options.threshold);

  if (belowThreshold.length > 0) {
    lines.push(`⚠️  Files below threshold (${options.threshold}):`);
    lines.push('');

    for (const file of belowThreshold) {
      const relPath = relativePath(file.file, options.baseDir);
      lines.push(`┌─ ${relPath}`);
      lines.push(`│  Score: ${coloredScore(file.fileScore)}/100 | Tests: ${file.testCount} | Lines: ${file.lineCount}`);

      if (file.suggestions.length > 0) {
        lines.push(`│`);
        for (const suggestion of file.suggestions) {
          lines.push(`│  💡 ${suggestion}`);
        }
      }

      if (options.verbose) {
        // Show individual tests below threshold
        const lowTests = file.tests.filter(t => t.overallScore < options.threshold);
        if (lowTests.length > 0) {
          lines.push(`│`);
          lines.push(`│  Tests needing attention:`);
          for (const test of lowTests) {
            lines.push(`│    • "${test.name}" (line ${test.line}): ${test.overallScore}/100`);
            for (const suggestion of test.suggestions.slice(0, 2)) {
              lines.push(`│      - ${suggestion}`);
            }
          }
        }
      }

      lines.push(`└─────────────────────────────────────────────────────────────`);
      lines.push('');
    }
  }

  // Score breakdown
  lines.push('📈 Score Distribution:');
  lines.push('');

  const brackets = [
    { label: 'A (90-100)', min: 90, max: 100 },
    { label: 'B (80-89)', min: 80, max: 89 },
    { label: 'C (70-79)', min: 70, max: 79 },
    { label: 'D (60-69)', min: 60, max: 69 },
    { label: 'F (0-59)', min: 0, max: 59 },
  ];

  for (const bracket of brackets) {
    const count = result.files.filter(f =>
      f.fileScore >= bracket.min && f.fileScore <= bracket.max
    ).length;
    const bar = '█'.repeat(Math.ceil(count / result.totalFiles * 20));
    lines.push(`   ${bracket.label.padEnd(12)} ${bar} ${count}`);
  }

  lines.push('');

  // Recommendations
  lines.push('💡 Scoring Criteria:');
  lines.push('   • Test Name (25%): Descriptive, uses action verbs');
  lines.push('   • Assertions (30%): 1-5 assertions per test');
  lines.push('   • Nesting (20%): Minimal depth, flat structure');
  lines.push('   • Length (25%): 10-30 lines per test');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate JSON report
 */
function generateJsonReport(result: AnalysisResult, options: ReportOptions): string {
  const report = {
    summary: {
      overallScore: result.overallScore,
      grade: getGrade(result.overallScore),
      totalFiles: result.totalFiles,
      totalTests: result.totalTests,
      analyzedAt: new Date().toISOString(),
    },
    files: result.files.map(file => ({
      path: relativePath(file.file, options.baseDir),
      score: file.fileScore,
      grade: getGrade(file.fileScore),
      lineCount: file.lineCount,
      testCount: file.testCount,
      suggestions: file.suggestions,
      tests: file.tests.map(test => ({
        name: test.name,
        line: test.line,
        scores: {
          overall: test.overallScore,
          name: test.nameScore,
          assertions: test.assertionScore,
          nesting: test.nestingScore,
          length: test.lengthScore,
        },
        suggestions: test.suggestions,
      })),
    })),
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Get score color class
 */
function getScoreClass(score: number): string {
  if (score >= 90) return 'score-a';
  if (score >= 80) return 'score-b';
  if (score >= 70) return 'score-c';
  if (score >= 60) return 'score-d';
  return 'score-f';
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate HTML report
 */
function generateHtmlReport(result: AnalysisResult, options: ReportOptions): string {
  const grade = getGrade(result.overallScore);
  const sortedFiles = [...result.files].sort((a, b) => a.fileScore - b.fileScore);
  const belowThreshold = sortedFiles.filter(f => f.fileScore < options.threshold);

  // Calculate grade distribution
  const distribution = {
    a: result.files.filter(f => f.fileScore >= 90).length,
    b: result.files.filter(f => f.fileScore >= 80 && f.fileScore < 90).length,
    c: result.files.filter(f => f.fileScore >= 70 && f.fileScore < 80).length,
    d: result.files.filter(f => f.fileScore >= 60 && f.fileScore < 70).length,
    f: result.files.filter(f => f.fileScore < 60).length,
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Readability Score Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1, h2, h3 { margin-bottom: 16px; }
    h1 { color: #1a1a2e; font-size: 28px; }
    h2 { color: #16213e; font-size: 22px; border-bottom: 2px solid #e94560; padding-bottom: 8px; margin-top: 32px; }
    h3 { color: #0f3460; font-size: 18px; }

    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-box {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .stat-value { font-size: 48px; font-weight: bold; }
    .stat-label { color: #666; font-size: 14px; text-transform: uppercase; }

    .score-a { color: #22c55e; }
    .score-b { color: #84cc16; }
    .score-c { color: #eab308; }
    .score-d { color: #f97316; }
    .score-f { color: #ef4444; }

    .grade-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    .grade-badge.score-a { background: #dcfce7; }
    .grade-badge.score-b { background: #ecfccb; }
    .grade-badge.score-c { background: #fef9c3; }
    .grade-badge.score-d { background: #ffedd5; }
    .grade-badge.score-f { background: #fee2e2; }

    .distribution-bar {
      display: flex;
      height: 32px;
      border-radius: 8px;
      overflow: hidden;
      margin: 16px 0;
    }
    .distribution-bar > div {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      min-width: 30px;
    }
    .bar-a { background: #22c55e; }
    .bar-b { background: #84cc16; }
    .bar-c { background: #eab308; }
    .bar-d { background: #f97316; }
    .bar-f { background: #ef4444; }

    .distribution-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 14px;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .file-list { margin-top: 16px; }
    .file-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
    }
    .file-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: #f9fafb;
      cursor: pointer;
      gap: 12px;
    }
    .file-header:hover { background: #f3f4f6; }
    .file-path {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
      word-break: break-all;
      flex: 1;
    }
    .file-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #666;
      flex-shrink: 0;
    }
    .file-content {
      display: none;
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: white;
    }
    .file-item.expanded .file-content { display: block; }
    .file-item.expanded .expand-icon { transform: rotate(180deg); }
    .expand-icon { transition: transform 0.2s; }

    .suggestion {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 12px;
      background: #fef3c7;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .suggestion-icon { flex-shrink: 0; }

    .test-item {
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .test-name {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .test-scores {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
    }
    .test-score-item {
      padding: 4px 8px;
      background: #f3f4f6;
      border-radius: 4px;
    }

    .criteria-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    .criteria-item {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #e94560;
    }
    .criteria-title { font-weight: bold; margin-bottom: 4px; }
    .criteria-weight { color: #666; font-size: 13px; }

    .timestamp {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 32px;
    }

    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: 1fr 1fr; }
      .file-meta { flex-direction: column; gap: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>📊 Test Readability Score Report</h1>

      <div class="summary-grid">
        <div class="stat-box">
          <div class="stat-value ${getScoreClass(result.overallScore)}">${result.overallScore}</div>
          <div class="stat-label">Overall Score</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${grade}</div>
          <div class="stat-label">Grade</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${result.totalFiles}</div>
          <div class="stat-label">Files Analyzed</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${result.totalTests}</div>
          <div class="stat-label">Tests Analyzed</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📈 Score Distribution</h2>
      <div class="distribution-bar">
        ${distribution.a > 0 ? `<div class="bar-a" style="flex: ${distribution.a}">${distribution.a}</div>` : ''}
        ${distribution.b > 0 ? `<div class="bar-b" style="flex: ${distribution.b}">${distribution.b}</div>` : ''}
        ${distribution.c > 0 ? `<div class="bar-c" style="flex: ${distribution.c}">${distribution.c}</div>` : ''}
        ${distribution.d > 0 ? `<div class="bar-d" style="flex: ${distribution.d}">${distribution.d}</div>` : ''}
        ${distribution.f > 0 ? `<div class="bar-f" style="flex: ${distribution.f}">${distribution.f}</div>` : ''}
      </div>
      <div class="distribution-legend">
        <div class="legend-item"><div class="legend-dot bar-a"></div> A (90-100): ${distribution.a}</div>
        <div class="legend-item"><div class="legend-dot bar-b"></div> B (80-89): ${distribution.b}</div>
        <div class="legend-item"><div class="legend-dot bar-c"></div> C (70-79): ${distribution.c}</div>
        <div class="legend-item"><div class="legend-dot bar-d"></div> D (60-69): ${distribution.d}</div>
        <div class="legend-item"><div class="legend-dot bar-f"></div> F (0-59): ${distribution.f}</div>
      </div>
    </div>

    ${belowThreshold.length > 0 ? `
    <div class="card">
      <h2>⚠️ Files Below Threshold (${options.threshold})</h2>
      <p style="color: #666; margin-bottom: 16px;">${belowThreshold.length} files need attention</p>

      <div class="file-list">
        ${belowThreshold.map(file => {
          const relPath = relativePath(file.file, options.baseDir);
          return `
          <div class="file-item">
            <div class="file-header" onclick="this.parentElement.classList.toggle('expanded')">
              <span class="file-path">${escapeHtml(relPath)}</span>
              <div class="file-meta">
                <span class="grade-badge ${getScoreClass(file.fileScore)}">${file.fileScore}/100</span>
                <span>${file.testCount} tests</span>
                <span>${file.lineCount} lines</span>
                <span class="expand-icon">▼</span>
              </div>
            </div>
            <div class="file-content">
              ${file.suggestions.length > 0 ? file.suggestions.map(s => `
                <div class="suggestion">
                  <span class="suggestion-icon">💡</span>
                  <span>${escapeHtml(s)}</span>
                </div>
              `).join('') : ''}

              ${file.tests.filter(t => t.overallScore < options.threshold).length > 0 ? `
                <h3 style="margin-top: 16px; margin-bottom: 12px;">Tests Needing Attention</h3>
                ${file.tests.filter(t => t.overallScore < options.threshold).map(test => `
                  <div class="test-item">
                    <div class="test-name">
                      <span class="grade-badge ${getScoreClass(test.overallScore)}">${test.overallScore}</span>
                      "${escapeHtml(test.name)}" <span style="color: #999;">(line ${test.line})</span>
                    </div>
                    <div class="test-scores">
                      <span class="test-score-item">Name: ${test.nameScore}</span>
                      <span class="test-score-item">Assertions: ${test.assertionScore}</span>
                      <span class="test-score-item">Nesting: ${test.nestingScore}</span>
                      <span class="test-score-item">Length: ${test.lengthScore}</span>
                    </div>
                    ${test.suggestions.length > 0 ? `
                      <div style="margin-top: 8px;">
                        ${test.suggestions.slice(0, 3).map(s => `<div class="suggestion"><span class="suggestion-icon">→</span>${escapeHtml(s)}</div>`).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              ` : ''}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : `
    <div class="card">
      <h2>✅ All Files Pass!</h2>
      <p>All ${result.totalFiles} files meet the threshold of ${options.threshold}.</p>
    </div>
    `}

    <div class="card">
      <h2>📋 Scoring Criteria</h2>
      <div class="criteria-grid">
        <div class="criteria-item">
          <div class="criteria-title">Test Name</div>
          <div class="criteria-weight">25% of score</div>
          <p style="margin-top: 8px; font-size: 14px;">Descriptive names with action verbs (should, displays, handles)</p>
        </div>
        <div class="criteria-item">
          <div class="criteria-title">Assertions</div>
          <div class="criteria-weight">30% of score</div>
          <p style="margin-top: 8px; font-size: 14px;">1-5 assertions per test is ideal</p>
        </div>
        <div class="criteria-item">
          <div class="criteria-title">Nesting Depth</div>
          <div class="criteria-weight">20% of score</div>
          <p style="margin-top: 8px; font-size: 14px;">Flat structure, minimal nesting (1-3 levels)</p>
        </div>
        <div class="criteria-item">
          <div class="criteria-title">Test Length</div>
          <div class="criteria-weight">25% of score</div>
          <p style="margin-top: 8px; font-size: 14px;">10-30 lines per test is ideal</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📁 All Files</h2>
      <div class="file-list">
        ${sortedFiles.map(file => {
          const relPath = relativePath(file.file, options.baseDir);
          return `
          <div class="file-item">
            <div class="file-header" onclick="this.parentElement.classList.toggle('expanded')">
              <span class="file-path">${escapeHtml(relPath)}</span>
              <div class="file-meta">
                <span class="grade-badge ${getScoreClass(file.fileScore)}">${file.fileScore}/100</span>
                <span>${file.testCount} tests</span>
                <span>${file.lineCount} lines</span>
                <span class="expand-icon">▼</span>
              </div>
            </div>
            <div class="file-content">
              ${file.tests.map(test => `
                <div class="test-item">
                  <div class="test-name">
                    <span class="grade-badge ${getScoreClass(test.overallScore)}">${test.overallScore}</span>
                    "${escapeHtml(test.name)}" <span style="color: #999;">(line ${test.line})</span>
                  </div>
                  <div class="test-scores">
                    <span class="test-score-item">Name: ${test.nameScore}</span>
                    <span class="test-score-item">Assertions: ${test.assertionScore}</span>
                    <span class="test-score-item">Nesting: ${test.nestingScore}</span>
                    <span class="test-score-item">Length: ${test.lengthScore}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="timestamp">
      Generated on ${new Date().toLocaleString()} • Threshold: ${options.threshold}
    </div>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate report in specified format
 */
export function generateReport(result: AnalysisResult, options: ReportOptions): string {
  if (options.format === 'json') {
    return generateJsonReport(result, options);
  }
  if (options.format === 'html') {
    return generateHtmlReport(result, options);
  }
  return generateTextReport(result, options);
}
