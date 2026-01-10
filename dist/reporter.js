"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
const path = __importStar(require("path"));
/**
 * Get relative path for cleaner output
 */
function relativePath(filePath, baseDir) {
    return path.relative(baseDir, filePath);
}
/**
 * Get grade from score
 */
function getGrade(score) {
    if (score >= 90)
        return 'A';
    if (score >= 80)
        return 'B';
    if (score >= 70)
        return 'C';
    if (score >= 60)
        return 'D';
    return 'F';
}
/**
 * Get colored score (ANSI colors)
 */
function coloredScore(score) {
    if (score >= 80)
        return `\x1b[32m${score}\x1b[0m`; // Green
    if (score >= 60)
        return `\x1b[33m${score}\x1b[0m`; // Yellow
    return `\x1b[31m${score}\x1b[0m`; // Red
}
/**
 * Generate text report
 */
function generateTextReport(result, options) {
    const lines = [];
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
        const count = result.files.filter(f => f.fileScore >= bracket.min && f.fileScore <= bracket.max).length;
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
function generateJsonReport(result, options) {
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
 * Generate report in specified format
 */
function generateReport(result, options) {
    if (options.format === 'json') {
        return generateJsonReport(result, options);
    }
    return generateTextReport(result, options);
}
