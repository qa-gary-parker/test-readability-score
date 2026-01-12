# test-readability-score

A CLI tool that analyzes Playwright test files for readability and maintainability, scoring tests on naming, assertion density, nesting depth, and length.

## Why Use This?

Well-written tests serve as documentation for future developers. When tests are hard to read:
- **Debugging takes longer** - Understanding a failing test shouldn't require archaeology
- **Maintenance suffers** - Confusing tests get deleted instead of updated
- **Knowledge is lost** - What the test is actually verifying becomes unclear

This tool encourages tests-as-documentation by measuring and scoring readability.

## Installation

```bash
npm install -g test-readability-score
```

Or run directly with npx:

```bash
npx test-readability-score ./tests/
```

## Quick Start

```bash
# Clone and install
git clone https://github.com/qa-gary-parker/test-readability-score.git
cd test-readability-score
npm install
npm run build

# Run on the included examples
node dist/index.js ./examples --verbose

# Or after global install
test-readability-score ./examples --verbose
```

## Usage

```bash
# Analyze tests in current directory
test-readability-score

# Analyze specific directory
test-readability-score ./tests/

# Set custom passing threshold (default: 70)
test-readability-score ./tests/ --threshold 80

# Output as JSON (for CI integration)
test-readability-score ./tests/ --format json

# Verbose mode (shows individual test scores)
test-readability-score ./tests/ --verbose
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --threshold <n>` | Minimum passing score (0-100). Exits with code 1 if overall score is below. | `70` |
| `-f, --format <fmt>` | Output format: `text`, `json`, or `html` | `text` |
| `-o, --output <file>` | Output file path (required for html format) | `readability-report.html` |
| `-v, --verbose` | Show individual test details for files below threshold | `false` |

## Example Output

Running on the included examples (`./examples/`):

```
Analyzing tests in: ./examples
Passing threshold: 70

═══════════════════════════════════════════════════════════════
                    TEST READABILITY SCORE
═══════════════════════════════════════════════════════════════

📊 Overall Score: 89/100 (Grade: B)
   Files analyzed: 3
   Tests analyzed: 17

⚠️  Files below threshold (70):

┌─ poor-tests.spec.ts
│  Score: 52/100 | Tests: 6 | Lines: 68
│
│  💡 File is getting long - consider splitting into multiple files
│
│  Tests needing attention:
│    • "test1" (line 10): 45/100
│      - Test name is too short - be more descriptive
│      - No assertions found - tests should verify expected behavior
│    • "should handle everything in one test" (line 23): 38/100
│      - Too many assertions - consider splitting into multiple tests
│      - Very deep nesting - refactor to reduce complexity
│      - Test is very long (>50 lines) - consider breaking it up
│
└─────────────────────────────────────────────────────────────

📈 Score Distribution:

   A (90-100)   ██████████████ 2
   B (80-89)     0
   C (70-79)    ███████ 1
   D (60-69)     0
   F (0-59)      0

💡 Scoring Criteria:
   • Test Name (25%): Descriptive, uses action verbs
   • Assertions (30%): 1-5 assertions per test
   • Nesting (20%): Minimal depth, flat structure
   • Length (25%): 10-30 lines per test
```

## Scoring Criteria

### Test Name (25% of score)

Good test names:
- Are **descriptive** (10+ characters)
- Use **action verbs** (should, displays, handles, validates, returns, etc.)
- Avoid **vague terms** (test1, works, basic, misc)

```typescript
// ❌ Bad: "test1", "works", "misc"
// ✅ Good: "should display error message when login fails with invalid credentials"
```

### Assertion Density (30% of score)

Tests should have a focused number of assertions:
- **0 assertions**: Major issue - test verifies nothing
- **1-5 assertions**: Ideal range
- **6-10 assertions**: Acceptable but consider splitting
- **10+ assertions**: Too many - test is doing too much

```typescript
// ❌ Bad: No assertions
test('loads page', async ({ page }) => {
  await page.goto('/');
});

// ❌ Bad: Too many assertions (15+)
test('tests everything', async ({ page }) => {
  await expect(...).toBeVisible();
  await expect(...).toBeVisible();
  // ... 13 more expects
});

// ✅ Good: Focused assertions (2-3)
test('should show error for invalid email', async ({ page }) => {
  await page.fill('[data-testid="email"]', 'invalid');
  await page.click('[data-testid="submit"]');
  await expect(page.locator('.error')).toBeVisible();
  await expect(page.locator('.error')).toContainText('valid email');
});
```

### Nesting Depth (20% of score)

Flat tests are easier to follow:
- **1-3 levels**: Good
- **4-5 levels**: Acceptable
- **6+ levels**: Needs refactoring

```typescript
// ❌ Bad: Deeply nested
test('nested test', async ({ page }) => {
  if (condition1) {
    if (condition2) {
      for (const item of items) {
        if (item.active) {
          // Hard to follow
        }
      }
    }
  }
});

// ✅ Good: Flat structure
test('flat test', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page.locator('h1')).toBeVisible();
});
```

### Test Length (25% of score)

Concise tests are easier to understand:
- **< 3 lines**: Too short - might be missing important setup/assertions
- **10-30 lines**: Ideal range
- **30-50 lines**: Getting long
- **50+ lines**: Too long - split into multiple tests

## Grades

| Grade | Score Range | Meaning |
|-------|-------------|---------|
| A | 90-100 | Excellent readability |
| B | 80-89 | Good - minor improvements possible |
| C | 70-79 | Acceptable - room for improvement |
| D | 60-69 | Needs attention |
| F | 0-59 | Significant readability issues |

## JSON Output

For CI integration, use `--format json`:

```json
{
  "summary": {
    "overallScore": 89,
    "grade": "B",
    "totalFiles": 3,
    "totalTests": 17,
    "analyzedAt": "2026-01-10T12:00:00.000Z"
  },
  "files": [
    {
      "path": "good-tests.spec.ts",
      "score": 95,
      "grade": "A",
      "lineCount": 58,
      "testCount": 5,
      "suggestions": [],
      "tests": [
        {
          "name": "should display error message when login fails",
          "line": 10,
          "scores": {
            "overall": 98,
            "name": 100,
            "assertions": 100,
            "nesting": 100,
            "length": 90
          },
          "suggestions": []
        }
      ]
    },
    {
      "path": "poor-tests.spec.ts",
      "score": 52,
      "grade": "F",
      "lineCount": 68,
      "testCount": 6,
      "suggestions": [
        "File is getting long - consider splitting into multiple files"
      ],
      "tests": [
        {
          "name": "test1",
          "line": 10,
          "scores": {
            "overall": 45,
            "name": 50,
            "assertions": 30,
            "nesting": 100,
            "length": 80
          },
          "suggestions": [
            "Test name is too short - be more descriptive",
            "No assertions found - tests should verify expected behavior"
          ]
        }
      ]
    }
  ]
}
```

## HTML Report

Generate a visual HTML report for easier review:

```bash
test-readability-score ./tests/ -f html -o report.html
```

The HTML report includes:

- **Score summary** with overall grade and distribution chart
- **File breakdown** with expandable sections showing individual test scores
- **Color-coded grades** (green for A/B, yellow for C/D, red for F)
- **Actionable suggestions** displayed alongside each test

To view an example, generate the report from the included examples:

```bash
node dist/index.js ./examples -f html -o examples/sample-report.html
open examples/sample-report.html
```

### HTML Report Preview

```
┌────────────────────────────────────────────────────────────────────┐
│                     TEST READABILITY REPORT                        │
├────────────────────────────────────────────────────────────────────┤
│  Overall Score: 89/100 (Grade B)                                   │
│  Files: 3 | Tests: 17                                              │
├────────────────────────────────────────────────────────────────────┤
│  📊 Score Distribution                                             │
│  ████████████████░░░░  A: 2 files                                  │
│  ░░░░░░░░░░░░░░░░░░░░  B: 0 files                                  │
│  ████████░░░░░░░░░░░░  C: 1 file                                   │
├────────────────────────────────────────────────────────────────────┤
│  📁 poor-tests.spec.ts  [Score: 52/100 - Grade F]                  │
│  ├─ test1                                    45/100   ⚠️            │
│  │  └─ Test name is too short                                      │
│  │  └─ No assertions found                                         │
│  ├─ should handle everything in one test     38/100   ⚠️            │
│  │  └─ Too many assertions (15)                                    │
│  │  └─ Deep nesting detected (6 levels)                            │
└────────────────────────────────────────────────────────────────────┘
```

## CI Integration

The tool exits with code 1 if the overall score is below threshold:

### GitHub Actions

```yaml
name: Test Quality
on: [push, pull_request]

jobs:
  readability:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npx test-readability-score ./tests/ --threshold 75
```

### Pre-commit Hook

```bash
#!/bin/sh
npx test-readability-score ./tests/ --threshold 70
```

### Track Over Time

```bash
# Output JSON and save to file for trend analysis
npx test-readability-score ./tests/ --format json > readability-report.json
```

## Example Test Files

The `examples/` directory contains tests demonstrating different readability levels:

### `good-tests.spec.ts` (Score: ~95)
- Descriptive test names with action verbs
- Focused assertions (2-3 per test)
- Flat structure
- Reasonable length

### `poor-tests.spec.ts` (Score: ~52)
- Vague test names ("test1", "works", "misc")
- Tests with no assertions
- One test with 20+ assertions
- Deeply nested conditionals
- Magic numbers without context

### `mixed-tests.spec.ts` (Score: ~85)
- Mix of good and mediocre practices
- Some tests could be improved
- Good for seeing gradual improvement suggestions

## How It Works

### 1. File Discovery
Scans for `*.spec.ts` and `*.test.ts` files, excluding `node_modules`.

### 2. AST Parsing
Uses `@typescript-eslint/typescript-estree` to parse test files and extract:
- Test names from `test()` and `it()` calls
- Test body content
- Line counts and nesting depth

### 3. Metric Calculation
For each test, calculates:
- **Name score**: Length, presence of action verbs, absence of vague terms
- **Assertion score**: Count of `expect()` calls vs ideal range
- **Nesting score**: Maximum brace depth in test body
- **Length score**: Line count vs ideal range

### 4. Aggregation
- Individual test scores weighted and averaged
- File scores = average of test scores
- Overall score = average of file scores

## Common Issues and Fixes

| Issue | Suggestion |
|-------|------------|
| "Test name is too short" | Use full sentences: "should display X when Y" |
| "No assertions found" | Add `expect()` statements to verify behavior |
| "Too many assertions" | Split into multiple focused tests |
| "Very deep nesting" | Extract helper functions, flatten logic |
| "Test is very long" | Break into setup, action, assertion phases |
| "Avoid vague names" | Be specific about what behavior is tested |

## Best Practices

1. **Name tests like documentation**: Someone reading only the test name should understand what's being verified
2. **One concept per test**: If you need "and" in your test name, it might be two tests
3. **Arrange-Act-Assert**: Clear structure makes tests easier to follow
4. **Keep tests independent**: Each test should work in isolation
5. **Use meaningful data**: Avoid magic numbers and unexplained strings

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## License

MIT
