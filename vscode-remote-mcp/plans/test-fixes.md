# VSCode Remote MCP Test Fixes Plan

## Current Status
- ✅ Fixed `validateSessionJoinAckPayload` export issue
- ✅ Fixed `validateTokenRefreshAckPayload` to properly validate the `validUntil` field
- ❌ Several other tests are still failing

## Step-by-Step Fix Plan

### 1. Fix Message Type Validator Helpers
- Update `validateMessageType` to use consistent error messages
- Ensure error message is "Message type must be a non-empty string" for all invalid cases

### 2. Fix Connection Message Validators
- Implement or export the following functions:
  - `validateConnectionPayload`
  - `validateConnectionAckPayload`
  - Ensure they validate all required fields and types

### 3. Fix Client State Model
- Implement or fix the `ClientConnectionState` class
- Implement or fix the `SessionParticipationState` class
- Ensure proper state transitions and validation

### 4. Fix Authentication Flow
- Implement token management functions
- Fix token refresh functionality
- Ensure proper error handling for authentication failures

### 5. Fix Graceful Shutdown
- Implement the `shutdownGracefully` function
- Ensure proper notification to clients before shutdown
- Add proper cleanup procedures

### 6. Improve Test Coverage
- Focus on increasing coverage for:
  - message-type-validator.js (currently at 51%)
  - message-flow-validator.js (currently at 67.18%)
  - auth-manager.js (currently at 80%)

### 7. Documentation
- Document all fixed functions
- Update README with test coverage information
- Add examples of proper message validation

## Execution Strategy
1. Fix one component at a time
2. Run targeted tests after each fix
3. Run full test suite after major components are fixed
4. Aim for at least 80% coverage across all metrics