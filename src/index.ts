#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { analyze } from './analyzer';
import { generateReport } from './reporter';

const program = new Command();

program
  .name('test-readability-score')
  .description('Analyze Playwright test files for readability and maintainability')
  .version('1.0.0')
  .argument('[directory]', 'Directory containing test files', '.')
  .option('-t, --threshold <number>', 'Minimum passing score (0-100)', '70')
  .option('-f, --format <format>', 'Output format: text or json', 'text')
  .option('-v, --verbose', 'Show individual test details', false)
  .action((directory: string, options: { threshold: string; format: string; verbose: boolean }) => {
    const dir = path.resolve(directory);
    const threshold = parseInt(options.threshold, 10);

    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      console.error('Error: Threshold must be a number between 0 and 100');
      process.exit(1);
    }

    console.log(`\nAnalyzing tests in: ${dir}`);
    console.log(`Passing threshold: ${threshold}\n`);

    try {
      const result = analyze(dir);

      const report = generateReport(result, {
        format: options.format as 'text' | 'json',
        verbose: options.verbose,
        baseDir: dir,
        threshold,
      });

      console.log(report);

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
