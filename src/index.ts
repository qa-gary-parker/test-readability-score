#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { analyze } from './analyzer';
import { generateReport } from './reporter';

const program = new Command();

program
  .name('test-readability-score')
  .description('Analyze Playwright test files for readability and maintainability')
  .version('1.0.0')
  .argument('[directory]', 'Directory containing test files', '.')
  .option('-t, --threshold <number>', 'Minimum passing score (0-100)', '70')
  .option('-f, --format <format>', 'Output format: text, json, or html', 'text')
  .option('-o, --output <file>', 'Output file path (required for html format)')
  .option('-v, --verbose', 'Show individual test details', false)
  .action((directory: string, options: { threshold: string; format: string; output?: string; verbose: boolean }) => {
    const dir = path.resolve(directory);
    const threshold = parseInt(options.threshold, 10);

    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      console.error('Error: Threshold must be a number between 0 and 100');
      process.exit(1);
    }

    // Determine output path for HTML
    let outputPath = options.output;
    if (options.format === 'html' && !outputPath) {
      outputPath = path.join(process.cwd(), 'readability-report.html');
    }

    console.log(`\nAnalyzing tests in: ${dir}`);
    console.log(`Passing threshold: ${threshold}\n`);

    try {
      const result = analyze(dir);

      const report = generateReport(result, {
        format: options.format as 'text' | 'json' | 'html',
        verbose: options.verbose,
        baseDir: dir,
        threshold,
        outputPath,
      });

      if (options.format === 'html') {
        fs.writeFileSync(outputPath!, report);
        console.log(`✅ HTML report generated: ${outputPath}`);
        console.log(`   Overall score: ${result.overallScore}/100`);
        console.log(`   Files analyzed: ${result.totalFiles}`);
        console.log(`   Tests analyzed: ${result.totalTests}`);
      } else {
        console.log(report);
      }

      // Exit with error code if below threshold (useful for CI)
      if (result.overallScore < threshold) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
