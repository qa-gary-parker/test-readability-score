import { AnalysisResult } from './analyzer';
export interface ReportOptions {
    format: 'text' | 'json';
    verbose: boolean;
    baseDir: string;
    threshold: number;
}
/**
 * Generate report in specified format
 */
export declare function generateReport(result: AnalysisResult, options: ReportOptions): string;
