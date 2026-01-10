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
exports.analyzeFile = analyzeFile;
exports.findTestFiles = findTestFiles;
exports.analyze = analyze;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const typescript_estree_1 = require("@typescript-eslint/typescript-estree");
/**
 * Score test name quality (0-100)
 */
function scoreTestName(name) {
    const suggestions = [];
    let score = 100;
    // Check length
    if (name.length < 10) {
        score -= 25;
        suggestions.push('Test name is too short - be more descriptive');
    }
    else if (name.length > 100) {
        score -= 15;
        suggestions.push('Test name is very long - consider being more concise');
    }
    // Check for action verbs
    const actionVerbs = ['should', 'displays', 'shows', 'renders', 'returns', 'throws', 'handles', 'validates', 'creates', 'updates', 'deletes', 'navigates', 'clicks', 'submits'];
    const hasActionVerb = actionVerbs.some(verb => name.toLowerCase().includes(verb));
    if (!hasActionVerb) {
        score -= 20;
        suggestions.push('Consider using action verbs (should, displays, handles, etc.)');
    }
    // Check for vague names
    const vagueTerms = ['test1', 'test2', 'works', 'basic', 'simple', 'misc'];
    const hasVagueTerm = vagueTerms.some(term => name.toLowerCase().includes(term));
    if (hasVagueTerm) {
        score -= 30;
        suggestions.push('Avoid vague names - describe the specific behavior being tested');
    }
    return { score: Math.max(0, score), suggestions };
}
/**
 * Score assertion density (0-100)
 */
function scoreAssertions(body, lineCount) {
    const suggestions = [];
    // Count assertions
    const assertionPatterns = [/expect\s*\(/g, /\.toBe/g, /\.toEqual/g, /\.toHave/g, /\.toContain/g, /\.toMatch/g];
    let assertionCount = 0;
    for (const pattern of assertionPatterns) {
        const matches = body.match(pattern);
        if (matches)
            assertionCount += matches.length;
    }
    // Ideal: 1-5 assertions per test
    let score = 100;
    if (assertionCount === 0) {
        score = 30;
        suggestions.push('No assertions found - tests should verify expected behavior');
    }
    else if (assertionCount > 10) {
        score = 60;
        suggestions.push('Too many assertions - consider splitting into multiple tests');
    }
    else if (assertionCount > 5) {
        score = 80;
        suggestions.push('Many assertions - consider if this test covers too much');
    }
    return { score, suggestions };
}
/**
 * Score nesting depth (0-100)
 */
function scoreNesting(body) {
    const suggestions = [];
    // Count max nesting by tracking braces
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of body) {
        if (char === '{') {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
        }
        else if (char === '}') {
            currentDepth--;
        }
    }
    let score = 100;
    if (maxDepth > 6) {
        score = 40;
        suggestions.push('Very deep nesting - refactor to reduce complexity');
    }
    else if (maxDepth > 4) {
        score = 70;
        suggestions.push('Consider reducing nesting depth for readability');
    }
    return { score, suggestions };
}
/**
 * Score test length (0-100)
 */
function scoreLength(lineCount) {
    const suggestions = [];
    let score = 100;
    if (lineCount > 50) {
        score = 50;
        suggestions.push('Test is very long (>50 lines) - consider breaking it up');
    }
    else if (lineCount > 30) {
        score = 70;
        suggestions.push('Test is getting long - consider if it does too much');
    }
    else if (lineCount < 3) {
        score = 80;
        suggestions.push('Very short test - ensure it verifies meaningful behavior');
    }
    return { score, suggestions };
}
/**
 * Parse a test file and analyze readability
 */
function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const tests = [];
    const fileSuggestions = [];
    try {
        const ast = (0, typescript_estree_1.parse)(content, {
            loc: true,
            range: true,
            jsx: true,
        });
        // Walk AST to find tests
        function walk(node) {
            if (!node || typeof node !== 'object')
                return;
            if (node.type === 'CallExpression' &&
                ((node.callee?.name === 'test' || node.callee?.name === 'it') ||
                    (node.callee?.object?.name === 'test' && node.callee?.property?.name !== 'describe'))) {
                const args = node.arguments || [];
                const nameArg = args[0];
                const fnArg = args.find((a) => a.type === 'ArrowFunctionExpression' || a.type === 'FunctionExpression');
                if (nameArg && fnArg) {
                    const testName = nameArg.value || nameArg.raw || 'unnamed';
                    const startLine = fnArg.loc?.start?.line || 0;
                    const endLine = fnArg.loc?.end?.line || 0;
                    const testLineCount = endLine - startLine + 1;
                    const bodyStart = fnArg.body?.range?.[0] || 0;
                    const bodyEnd = fnArg.body?.range?.[1] || content.length;
                    const body = content.slice(bodyStart, bodyEnd);
                    // Calculate scores
                    const nameResult = scoreTestName(testName);
                    const assertionResult = scoreAssertions(body, testLineCount);
                    const nestingResult = scoreNesting(body);
                    const lengthResult = scoreLength(testLineCount);
                    // Weighted overall score
                    const overallScore = Math.round(nameResult.score * 0.25 +
                        assertionResult.score * 0.30 +
                        nestingResult.score * 0.20 +
                        lengthResult.score * 0.25);
                    const suggestions = [
                        ...nameResult.suggestions,
                        ...assertionResult.suggestions,
                        ...nestingResult.suggestions,
                        ...lengthResult.suggestions,
                    ];
                    tests.push({
                        name: testName,
                        line: node.loc?.start?.line || 0,
                        nameScore: nameResult.score,
                        assertionScore: assertionResult.score,
                        nestingScore: nestingResult.score,
                        lengthScore: lengthResult.score,
                        overallScore,
                        suggestions,
                    });
                }
            }
            for (const key of Object.keys(node)) {
                const child = node[key];
                if (Array.isArray(child)) {
                    child.forEach(walk);
                }
                else if (child && typeof child === 'object') {
                    walk(child);
                }
            }
        }
        walk(ast);
    }
    catch (error) {
        fileSuggestions.push(`Parse error: ${error.message}`);
    }
    // File-level suggestions
    if (lines.length > 500) {
        fileSuggestions.push('File is very long - consider splitting into multiple files');
    }
    if (tests.length > 20) {
        fileSuggestions.push('Many tests in one file - consider organizing into smaller files');
    }
    const fileScore = tests.length > 0
        ? Math.round(tests.reduce((sum, t) => sum + t.overallScore, 0) / tests.length)
        : 0;
    return {
        file: filePath,
        tests,
        fileScore,
        lineCount: lines.length,
        testCount: tests.length,
        suggestions: fileSuggestions,
    };
}
/**
 * Find all test files
 */
function findTestFiles(dir) {
    const files = [];
    function walkDir(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                walkDir(fullPath);
            }
            else if (entry.isFile() && (fullPath.endsWith('.spec.ts') || fullPath.endsWith('.test.ts'))) {
                files.push(fullPath);
            }
        }
    }
    walkDir(dir);
    return files;
}
/**
 * Main analysis function
 */
function analyze(directory) {
    const files = findTestFiles(directory);
    const fileMetrics = [];
    for (const file of files) {
        fileMetrics.push(analyzeFile(file));
    }
    const totalTests = fileMetrics.reduce((sum, f) => sum + f.testCount, 0);
    const overallScore = fileMetrics.length > 0
        ? Math.round(fileMetrics.reduce((sum, f) => sum + f.fileScore, 0) / fileMetrics.length)
        : 0;
    return {
        files: fileMetrics,
        overallScore,
        totalTests,
        totalFiles: fileMetrics.length,
    };
}
