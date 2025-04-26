/**
 * Constants for request/response schema validation
 */

const STATUS_VALUES = {
  CONNECTION: ['connected', 'rejected', 'pending'],
  SESSION_CREATE: ['created', 'rejected', 'pending'],
  SESSION_JOIN: ['joined', 'rejected', 'pending'],
  TOKEN_REFRESH: ['accepted', 'rejected']
};

const PATTERNS = {
  ISO_DATE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
};

module.exports = {
  STATUS_VALUES,
  PATTERNS
};