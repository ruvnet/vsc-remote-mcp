# VSCode Remote MCP Tests

This directory contains tests for the VSCode Remote MCP system.

## Message Format Tests

The `message-validator.test.js` file contains tests for the message format validation functions. These tests ensure that:

1. Message types are properly validated (must be non-empty strings)
2. Message payloads are properly validated (must be present)
3. Message IDs are properly validated (must be non-empty strings when provided)
4. Message timestamps are properly validated (must be valid ISO 8601 timestamps when provided)
5. Complete messages are properly validated (all required fields present and valid)

## Running Tests

To run the tests, use the following command from the project root:

```bash
npm test
```

To run tests in watch mode during development:

```bash
npm run test:watch
```

## Test Coverage

The tests are configured to generate coverage reports. The coverage threshold is set to 80% for:

- Branches
- Functions
- Lines
- Statements

Coverage reports are generated in the `coverage` directory.

## Test Structure

Tests follow the Jest testing framework conventions:

- `describe` blocks group related tests
- `test` or `it` blocks define individual test cases
- `expect` statements define assertions

Example:

```javascript
describe('validateMessageType', () => {
  test('should accept valid message types', () => {
    expect(validateMessageType('connection')).toBe(true);
  });

  test('should reject empty message types', () => {
    expect(() => validateMessageType('')).toThrow('Message type must be a non-empty string');
  });
});
```

## Adding New Tests

When adding new validation functions, follow these guidelines:

1. Create tests for both valid and invalid inputs
2. Test edge cases (empty strings, null values, etc.)
3. Ensure error messages are descriptive and helpful
4. Maintain high test coverage