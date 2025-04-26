# Message Type Validator Fixes

## Current Status
- We've fixed the basic `validateMessageType` function by adding missing message types:
  - Added 'session_create_ack'
  - Added 'terminal'
  - Added 'heartbeat'
  - Added 'token_refresh'
- The basic message-validator.test.js tests are now passing
- Current test coverage is low (3.8% for message-type-validator.js)

## Issues to Fix
1. **Low Test Coverage**: Need to increase test coverage to meet the 80% threshold
2. **Missing Message Type Validations**: Need to implement additional validation for message types
3. **Edge Cases**: Need to handle edge cases in message type validation
4. **Error Messages**: Need to improve error messages for validation failures

## Step-by-Step Plan

### 1. Implement Additional Validation Functions
- [ ] Add `validateMessageTypeFormat` function to check format of message types
  - Should validate that message types follow naming conventions (lowercase, underscores)
  - Should reject message types with invalid characters
  - Should reject message types that are too long (>50 chars)
- [ ] Add `validateMessageTypeCategory` function to group message types by category
  - Connection-related: 'connection', 'connection_request', etc.
  - Session-related: 'session_create', 'session_join', etc.
  - Command-related: 'command_request', 'command_response'
  - Token-related: 'token_refresh', 'token_refresh_request', etc.
- [ ] Add `isSystemMessageType` function to identify system message types
  - System types: 'heartbeat', 'error', 'notification', etc.

### 2. Add Tests for New Validation Functions
- [ ] Add tests for `validateMessageTypeFormat`
  - Test valid formats
  - Test invalid formats (uppercase, spaces, special chars)
  - Test edge cases (empty, very long)
- [ ] Add tests for `validateMessageTypeCategory`
  - Test each category
  - Test unknown category
- [ ] Add tests for `isSystemMessageType`
  - Test system types
  - Test non-system types

### 3. Improve Error Messages
- [ ] Add detailed error messages for validation failures
  - Include the invalid value in the error message
  - Suggest valid alternatives when possible
  - Include validation rules in the error message

### 4. Add Helper Functions
- [ ] Add `getMessageTypeCategory` function to get category of a message type
- [ ] Add `getRelatedMessageTypes` function to get related message types
- [ ] Add `isResponseMessageType` function to check if a message type is a response

### 5. Add Tests for Helper Functions
- [ ] Add tests for `getMessageTypeCategory`
- [ ] Add tests for `getRelatedMessageTypes`
- [ ] Add tests for `isResponseMessageType`

### 6. Refactor for Maintainability
- [ ] Organize message types by category in the allowedTypes array
- [ ] Add comments to explain each category
- [ ] Extract validation logic into separate functions
- [ ] Add JSDoc comments for all functions

## Expected Outcome
- Increased test coverage to >80%
- More robust message type validation
- Better error messages for validation failures
- More maintainable code structure