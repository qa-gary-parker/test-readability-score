# test-readability-score

CLI tool to analyze Playwright test files for readability and maintainability. Treats tests as documentation.

## Why?

Well-written tests tell future developers what the code should do. This tool helps you maintain test quality by scoring:

- **Test names** - Are they descriptive? Do they explain behavior?
- **Assertions** - Right number per test? Not too many, not too few?
- **Nesting depth** - Is the code flat and readable?
- **Test length** - Short enough to understand at a glance?

## Installation

```bash
npm install -g test-readability-score
```

Or run directly with npx:

```bash
npx test-readability-score ./tests/
```

## Usage

```bash
# Analyze current directory
test-readability-score

# Analyze specific directory
test-readability-score ./tests/

# Set custom passing threshold (default: 70)
test-readability-score ./tests/ --threshold 80

# Output as JSON
test-readability-score ./tests/ --format json

# Verbose mode (show individual test details)
test-readability-score ./tests/ --verbose
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --threshold <n>` | Minimum passing score (0-100) | 70 |
| `-f, --format <fmt>` | Output format: text or json | text |
| `-v, --verbose` | Show individual test details | false |

## Scoring Criteria

| Metric | Weight | What it measures |
|--------|--------|------------------|
| Test Name | 25% | Descriptiveness, action verbs, avoiding vague terms |
| Assertions | 30% | 1-5 assertions per test is ideal |
| Nesting | 20% | Shallow depth, flat structure |
| Length | 25% | 10-30 lines per test is ideal |

## Grades

- **A (90-100)**: Excellent readability
- **B (80-89)**: Good, minor improvements possible
- **C (70-79)**: Acceptable, room for improvement
- **D (60-69)**: Needs attention
- **F (0-59)**: Significant readability issues

## CI Integration

The tool exits with code 1 if the overall score is below threshold:

```yaml
- name: Check test readability
  run: npx test-readability-score ./tests/ --threshold 75
```

## License

MIT
