# Message Type Validator Helpers Fixes

## Current Status
- The message-type-validator-helpers.test.js file is skipped in the test suite
- We need to implement helper functions for message type validation
- We need to add tests for these helper functions

## Issues to Fix
1. **Missing Helper Functions**: Need to implement helper functions for message type validation
2. **Low Test Coverage**: Need to increase test coverage to meet the 80% threshold
3. **Code Organization**: Need to improve code organization for maintainability

## Step-by-Step Plan

### 1. Implement Message Type Category Functions
- [ ] Add `getMessageTypeCategory` function to categorize message types:
  ```javascript
  /**
   * Get the category of a message type
   * @param {string} type - The message type
   * @returns {string} The category of the message type
   */
  function getMessageTypeCategory(type) {
    if (type.startsWith('connection')) return 'connection';
    if (type.startsWith('session')) return 'session';
    if (type.startsWith('command')) return 'command';
    if (type.startsWith('token')) return 'token';
    if (['heartbeat', 'error', 'notification'].includes(type)) return 'system';
    if (['editor', 'terminal', 'extension'].includes(type)) return 'client';
    return 'unknown';
  }
  ```
- [ ] Add `isSystemMessageType` function to identify system message types:
  ```javascript
  /**
   * Check if a message type is a system message type
   * @param {string} type - The message type
   * @returns {boolean} True if the message type is a system message type
   */
  function isSystemMessageType(type) {
    return getMessageTypeCategory(type) === 'system';
  }
  ```

### 2. Implement Message Type Relationship Functions
- [ ] Add `getRelatedMessageTypes` function to get related message types:
  ```javascript
  /**
   * Get related message types for a given message type
   * @param {string} type - The message type
   * @returns {string[]} Related message types
   */
  function getRelatedMessageTypes(type) {
    const category = getMessageTypeCategory(type);
    return allowedTypes.filter(t => getMessageTypeCategory(t) === category);
  }
  ```
- [ ] Add `getRequestResponsePair` function to get request-response pairs:
  ```javascript
  /**
   * Get the request or response message type for a given message type
   * @param {string} type - The message type
   * @returns {string|null} The paired message type, or null if not applicable
   */
  function getRequestResponsePair(type) {
    if (type.endsWith('_request')) {
      return type.replace('_request', '_response');
    }
    if (type.endsWith('_response')) {
      return type.replace('_response', '_request');
    }
    return null;
  }
  ```

### 3. Implement Message Type Validation Helper Functions
- [ ] Add `validateMessageTypeFormat` function to validate message type format:
  ```javascript
  /**
   * Validate the format of a message type
   * @param {string} type - The message type
   * @returns {boolean} True if the format is valid
   * @throws {Error} If the format is invalid
   */
  function validateMessageTypeFormat(type) {
    if (!/^[a-z_]+$/.test(type)) {
      throw new Error(`Invalid message type format: ${type}. Must contain only lowercase letters and underscores.`);
    }
    if (type.length > 50) {
      throw new Error(`Invalid message type length: ${type}. Must be 50 characters or less.`);
    }
    return true;
  }
  ```
- [ ] Add `validateMessageTypeCategory` function to validate message type category:
  ```javascript
  /**
   * Validate the category of a message type
   * @param {string} type - The message type
   * @param {string} expectedCategory - The expected category
   * @returns {boolean} True if the category is valid
   * @throws {Error} If the category is invalid
   */
  function validateMessageTypeCategory(type, expectedCategory) {
    const category = getMessageTypeCategory(type);
    if (category !== expectedCategory) {
      throw new Error(`Invalid message type category: ${type}. Expected ${expectedCategory}, got ${category}.`);
    }
    return true;
  }
  ```

### 4. Add Tests for Category Functions
- [ ] Add tests for `getMessageTypeCategory`:
  - Test each category
  - Test unknown category
- [ ] Add tests for `isSystemMessageType`:
  - Test system types
  - Test non-system types

### 5. Add Tests for Relationship Functions
- [ ] Add tests for `getRelatedMessageTypes`:
  - Test each category
  - Test unknown category
- [ ] Add tests for `getRequestResponsePair`:
  - Test request types
  - Test response types
  - Test non-paired types

### 6. Add Tests for Validation Helper Functions
- [ ] Add tests for `validateMessageTypeFormat`:
  - Test valid formats
  - Test invalid formats (uppercase, spaces, special chars)
  - Test edge cases (empty, very long)
- [ ] Add tests for `validateMessageTypeCategory`:
  - Test valid categories
  - Test invalid categories

### 7. Refactor for Maintainability
- [ ] Organize functions by category
- [ ] Add JSDoc comments for all functions
- [ ] Extract common validation logic

## Expected Outcome
- Increased test coverage to >80%
- Robust helper functions for message type validation
- Better code organization for maintainability
- Improved developer experience with helper functions