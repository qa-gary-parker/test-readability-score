#!/usr/bin/env node
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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const analyzer_1 = require("./analyzer");
const reporter_1 = require("./reporter");
const program = new commander_1.Command();
program
    .name('test-readability-score')
    .description('Analyze Playwright test files for readability and maintainability')
    .version('1.0.0')
    .argument('[directory]', 'Directory containing test files', '.')
    .option('-t, --threshold <number>', 'Minimum passing score (0-100)', '70')
    .option('-f, --format <format>', 'Output format: text or json', 'text')
    .option('-v, --verbose', 'Show individual test details', false)
    .action((directory, options) => {
    const dir = path.resolve(directory);
    const threshold = parseInt(options.threshold, 10);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        console.error('Error: Threshold must be a number between 0 and 100');
        process.exit(1);
    }
    console.log(`\nAnalyzing tests in: ${dir}`);
    console.log(`Passing threshold: ${threshold}\n`);
    try {
        const result = (0, analyzer_1.analyze)(dir);
        const report = (0, reporter_1.generateReport)(result, {
            format: options.format,
            verbose: options.verbose,
            baseDir: dir,
            threshold,
        });
        console.log(report);
        // Exit with error code if below threshold (useful for CI)
        if (result.overallScore < threshold) {
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
program.parse();
