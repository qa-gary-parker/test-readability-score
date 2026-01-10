export interface TestMetrics {
    name: string;
    line: number;
    nameScore: number;
    assertionScore: number;
    nestingScore: number;
    lengthScore: number;
    overallScore: number;
    suggestions: string[];
}
export interface FileMetrics {
    file: string;
    tests: TestMetrics[];
    fileScore: number;
    lineCount: number;
    testCount: number;
    suggestions: string[];
}
export interface AnalysisResult {
    files: FileMetrics[];
    overallScore: number;
    totalTests: number;
    totalFiles: number;
}
/**
 * Parse a test file and analyze readability
 */
export declare function analyzeFile(filePath: string): FileMetrics;
/**
 * Find all test files
 */
export declare function findTestFiles(dir: string): string[];
/**
 * Main analysis function
 */
export declare function analyze(directory: string): AnalysisResult;
