# MCP Response Format Standards

## Table of Contents
- [Overview](#overview)
- [Response Format Requirements](#response-format-requirements)
- [Response Types](#response-types)
  - [Text Responses](#text-responses)
  - [Image Responses](#image-responses)
  - [Resource Responses](#resource-responses)
  - [Error Responses](#error-responses)
- [Wrapper Functions](#wrapper-functions)
  - [Success Response Wrapper](#success-response-wrapper)
  - [Error Response Wrapper](#error-response-wrapper)
  - [Tool Response Wrapper](#tool-response-wrapper)
- [Common Pitfalls and Errors](#common-pitfalls-and-errors)
- [Best Practices](#best-practices)
- [Testing Procedures](#testing-procedures)

## Overview

The Management Control Panel (MCP) requires all tool responses to follow a standardized format to ensure consistent handling by client applications. This document outlines the required format, provides examples, and offers best practices for implementing MCP-compliant tools.

All MCP tool responses must include a `content` array that contains one or more content items, each with a specific type. This standardized format allows clients to properly display different types of content (text, images, resources) and handle errors consistently.

## Response Format Requirements

Every MCP tool response must adhere to the following structure:

```javascript
{
  success: boolean,          // Whether the operation was successful
  timestamp: Date,           // When the response was generated
  content: [                 // Array of content items (REQUIRED)
    {
      type: string,          // Content type (e.g., "text", "image", "resource")
      ...typeSpecificFields  // Fields specific to the content type
    }
  ],
  data?: any,                // Optional response data (when success is true)
  error?: {                  // Optional error information (when success is false)
    code: string,            // Error code
    message: string,         // Human-readable error message
    details?: any            // Additional error details
  }
}
```

### Key Requirements:

1. **Every response must include a `content` array**, even if it's just a simple success message
2. **Each content item must have a `type` field** that indicates how to interpret the content
3. **Success responses must set `success: true`** and may include a `data` field with additional information
4. **Error responses must set `success: false`** and include an `error` object with code and message
5. **All responses must include a `timestamp`** indicating when the response was generated

## Response Types

### Text Responses

Text responses are the most common type and should be used for simple messages, status updates, and formatted text output.

#### Format:

```javascript
{
  type: "text",
  text: string  // The text content to display
}
```

#### Example:

```javascript
{
  success: true,
  timestamp: new Date(),
  content: [
    {
      type: "text",
      text: "Instance 'vscode-instance-1' started successfully"
    }
  ],
  data: {
    instanceId: "instance-1",
    status: "running"
  }
}
```

### Image Responses

Image responses are used to return images, charts, or diagrams.

#### Format:

```javascript
{
  type: "image",
  url: string,           // URL to the image
  altText: string,       // Alternative text for accessibility
  width?: number,        // Optional width in pixels
  height?: number,       // Optional height in pixels
  caption?: string       // Optional caption text
}
```

#### Example:

```javascript
{
  success: true,
  timestamp: new Date(),
  content: [
    {
      type: "text",
      text: "Instance CPU usage over time:"
    },
    {
      type: "image",
      url: "https://example.com/charts/cpu-usage.png",
      altText: "CPU usage chart showing spikes during peak hours",
      width: 800,
      height: 400,
      caption: "CPU usage for instance-1 over the last 24 hours"
    }
  ],
  data: {
    instanceId: "instance-1",
    metrics: {
      cpu: {
        average: 45,
        peak: 87
      }
    }
  }
}
```

### Resource Responses

Resource responses are used to return references to resources like files, URLs, or other assets.

#### Format:

```javascript
{
  type: "resource",
  resourceType: string,  // Type of resource (e.g., "file", "url", "instance")
  identifier: string,    // Resource identifier
  name: string,          // Display name for the resource
  description?: string,  // Optional description
  metadata?: object      // Optional metadata about the resource
}
```

#### Example:

```javascript
{
  success: true,
  timestamp: new Date(),
  content: [
    {
      type: "text",
      text: "VSCode instance deployed successfully. You can access it using the following URL:"
    },
    {
      type: "resource",
      resourceType: "url",
      identifier: "http://localhost:8080",
      name: "VSCode Web UI",
      description: "Web-based VSCode interface for your instance",
      metadata: {
        requiresAuth: true,
        authType: "password"
      }
    }
  ],
  data: {
    instanceId: "instance-1",
    name: "vscode-instance-1",
    status: "running"
  }
}
```

### Error Responses

Error responses must be used when an operation fails. They should provide clear information about what went wrong and how to fix it.

#### Format:

```javascript
{
  success: false,
  timestamp: new Date(),
  content: [
    {
      type: "text",
      text: string  // Human-readable error message
    }
  ],
  error: {
    code: string,    // Error code for programmatic handling
    message: string, // Error message (same as in content)
    details?: any    // Additional error details
  }
}
```

#### Example:

```javascript
{
  success: false,
  timestamp: new Date(),
  content: [
    {
      type: "text",
      text: "Error: Instance 'instance-1' not found"
    }
  ],
  error: {
    code: "INSTANCE_NOT_FOUND",
    message: "Instance 'instance-1' not found",
    details: {
      instanceId: "instance-1",
      availableInstances: ["instance-2", "instance-3"]
    }
  }
}
```

## Wrapper Functions

To ensure consistent response formatting, use the following wrapper functions in your tool implementations.

### Success Response Wrapper

Use this function to create standardized successful responses:

```javascript
/**
 * Creates a standardized successful response
 * @param {Object} data - Response data
 * @returns {Object} - Standardized response object with MCP-compliant format
 */
function createSuccessResponse(data) {
  // Create a human-readable text representation based on the data
  let textContent = '';
  
  // Format the text content based on the data type
  // This example shows formatting for an instance object
  if (data.instance) {
    const instance = data.instance;
    textContent = `Instance: ${instance.name || instance.id}\n`;
    
    if (instance.status) {
      textContent += `Status: ${typeof instance.status === 'object' ? instance.status.current : instance.status}\n`;
    }
    
    // Add more formatting logic for different data types...
  } else {
    // Default to JSON string for other data types
    textContent = JSON.stringify(data, null, 2);
  }
  
  return {
    content: [
      {
        type: 'text',
        text: textContent
      }
    ],
    success: true,
    timestamp: new Date(),
    data
  };
}
```

### Error Response Wrapper

Use this function to create standardized error responses:

```javascript
/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} - Standardized error response object with MCP-compliant format
 */
function createErrorResponse(message, code = 'UNKNOWN_ERROR', details = null) {
  const error = {
    code,
    message
  };
  
  if (details) {
    error.details = details;
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${message}`
      }
    ],
    success: false,
    timestamp: new Date(),
    error
  };
}
```

### Tool Response Wrapper

Use this function to wrap existing tool functions to ensure they return MCP-compliant responses:

```javascript
/**
 * Wrap tool responses to include content array
 * @param {Function} toolFn - Original tool function
 * @returns {Function} - Wrapped tool function
 */
function wrapToolResponse(toolFn) {
  return async function(args) {
    try {
      const result = await toolFn(args || {});
      
      // If the result already has a content array, return it as is
      if (result && Array.isArray(result.content)) {
        return result;
      }
      
      // If the result is successful, wrap it in a content array with proper MCP format
      if (result && result.success) {
        // Create a text representation of the result data
        let textContent = '';
        if (result.data) {
          textContent = JSON.stringify(result.data, null, 2);
        } else if (result.message) {
          textContent = result.message;
        } else {
          textContent = 'Operation completed successfully';
        }
        
        return {
          ...result,
          content: [
            {
              type: "text",
              text: textContent
            }
          ]
        };
      }
      
      // If the result is an error, format it properly
      if (result && !result.success) {
        const errorMessage = result.error?.message || 'Unknown error';
        return {
          ...result,
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`
            }
          ]
        };
      }
      
      // Default fallback
      return result;
    } catch (error) {
      console.error('Error in tool:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        content: [
          {
            type: "text",
            text: `Error: ${error.message || 'Unknown error'}`
          }
        ]
      };
    }
  };
}
```

## Common Pitfalls and Errors

### 1. Missing Content Array

**Problem**: Returning a response without a `content` array.

**Incorrect**:
```javascript
return {
  success: true,
  data: { instanceId: "instance-1" }
};
```

**Correct**:
```javascript
return {
  success: true,
  timestamp: new Date(),
  content: [
    {
      type: "text",
      text: "Operation completed successfully"
    }
  ],
  data: { instanceId: "instance-1" }
};
```

### 2. Inconsistent Error Formatting

**Problem**: Returning errors in different formats or without proper error objects.

**Incorrect**:
```javascript
throw new Error("Instance not found");
// or
return { success: false, message: "Instance not found" };
```

**Correct**:
```javascript
return createErrorResponse(
  "Instance not found",
  "INSTANCE_NOT_FOUND",
  { instanceId: "instance-1" }
);
```

### 3. Missing Type Field in Content Items

**Problem**: Including content items without specifying their type.

**Incorrect**:
```javascript
return {
  success: true,
  content: [
    { text: "Operation completed" }  // Missing type field
  ]
};
```

**Correct**:
```javascript
return {
  success: true,
  timestamp: new Date(),
  content: [
    { 
      type: "text",
      text: "Operation completed" 
    }
  ]
};
```

### 4. Returning Raw Data Without Formatting

**Problem**: Returning complex data structures without proper text representation.

**Incorrect**:
```javascript
return {
  success: true,
  content: [
    { 
      type: "text",
      text: JSON.stringify(complexData)  // Hard to read
    }
  ],
  data: complexData
};
```

**Correct**:
```javascript
// Format the data into a human-readable text representation
const formattedText = formatComplexDataAsText(complexData);
return {
  success: true,
  timestamp: new Date(),
  content: [
    { 
      type: "text",
      text: formattedText  // Properly formatted for human readability
    }
  ],
  data: complexData  // Original data still available for programmatic use
};
```

### 5. Inconsistent Success/Error Flags

**Problem**: Using inconsistent fields to indicate success or failure.

**Incorrect**:
```javascript
// Different tools using different fields
return { ok: true, data: {...} };
return { status: "success", result: {...} };
```

**Correct**:
```javascript
// Always use the standard success field
return {
  success: true,
  timestamp: new Date(),
  content: [...],
  data: {...}
};
```

## Best Practices

### 1. Always Use Wrapper Functions

Always use the provided wrapper functions (`createSuccessResponse`, `createErrorResponse`) to ensure consistent formatting. Don't manually construct response objects.

```javascript
// Good practice
return createSuccessResponse({ instance: instanceDetails });

// Avoid
return {
  success: true,
  content: [{ type: "text", text: "..." }],
  data: { instance: instanceDetails }
};
```

### 2. Provide Human-Readable Text

Format complex data into human-readable text in the content array, even when returning structured data in the `data` field.

```javascript
// Format instance details into a readable text representation
let textContent = `Instance: ${instance.name}\n`;
textContent += `Status: ${instance.status}\n`;
textContent += `Provider: ${instance.provider}\n`;
// ...

return createSuccessResponse({
  instance: instanceDetails,  // Structured data
  textContent: textContent    // Human-readable representation
});
```

### 3. Include Detailed Error Information

Provide specific error codes and detailed information to help diagnose and fix issues.

```javascript
if (!instance) {
  return createErrorResponse(
    `Instance ${params.instanceId} not found`,
    'INSTANCE_NOT_FOUND',
    { 
      instanceId: params.instanceId,
      availableInstances: getAllInstanceIds()
    }
  );
}
```

### 4. Handle Exceptions Consistently

Catch exceptions and convert them to proper error responses rather than letting them propagate.

```javascript
async function myTool(params) {
  try {
    // Tool implementation
    return createSuccessResponse({ result });
  } catch (error) {
    console.error('Error in myTool:', error);
    return createErrorResponse(
      `Failed to execute tool: ${error.message}`,
      'TOOL_EXECUTION_ERROR',
      { originalError: error.toString() }
    );
  }
}
```

### 5. Use Appropriate Content Types

Choose the appropriate content type for the data you're returning. Combine multiple content types when necessary.

```javascript
// Returning both text and a resource
return {
  success: true,
  timestamp: new Date(),
  content: [
    {
      type: "text",
      text: "Instance created successfully. Access it using the following URL:"
    },
    {
      type: "resource",
      resourceType: "url",
      identifier: instance.url,
      name: "VSCode Web Interface"
    }
  ],
  data: { instance }
};
```

### 6. Format Text for Readability

When returning text content, format it for readability with line breaks, indentation, and clear structure.

```javascript
// Format instance list as a readable table
let textContent = `Found ${instances.length} instances\n\n`;
textContent += "ID\tName\tStatus\tProvider\n";
textContent += "----------------------------------------\n";

instances.forEach(instance => {
  textContent += `${instance.id}\t${instance.name}\t${instance.status}\t${instance.provider}\n`;
});

return createSuccessResponse({
  instances,
  textContent
});
```

### 7. Validate Response Format Before Returning

Implement validation to ensure your responses meet the required format before returning them.

```javascript
function validateMcpResponse(response) {
  if (typeof response.success !== 'boolean') {
    throw new Error('Response must include a boolean success field');
  }
  
  if (!Array.isArray(response.content)) {
    throw new Error('Response must include a content array');
  }
  
  for (const item of response.content) {
    if (!item.type) {
      throw new Error('Each content item must include a type field');
    }
  }
  
  if (!response.timestamp) {
    response.timestamp = new Date();
  }
  
  return response;
}

// Use before returning
return validateMcpResponse(myResponse);
```

## Testing Procedures

To ensure your MCP tool responses meet the required format standards, implement the following testing procedures:

### 1. Unit Tests for Response Format

Create unit tests that verify the structure of your responses:

```javascript
describe('MCP Response Format', () => {
  test('Success response should have required fields', async () => {
    const response = await myTool({ param: 'value' });
    
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('timestamp');
    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    
    // Check content items
    for (const item of response.content) {
      expect(item).toHaveProperty('type');
    }
  });
  
  test('Error response should have required fields', async () => {
    // Trigger an error condition
    const response = await myTool({ invalidParam: true });
    
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('timestamp');
    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response).toHaveProperty('error');
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  });
});
```

### 2. Schema Validation

Use JSON Schema to validate response formats:

```javascript
const Ajv = require('ajv');
const ajv = new Ajv();

const mcpResponseSchema = {
  type: 'object',
  required: ['success', 'timestamp', 'content'],
  properties: {
    success: { type: 'boolean' },
    timestamp: { type: 'string', format: 'date-time' },
    content: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' }
        },
        allOf: [
          {
            if: { properties: { type: { const: 'text' } } },
            then: { required: ['text'], properties: { text: { type: 'string' } } }
          },
          {
            if: { properties: { type: { const: 'image' } } },
            then: { required: ['url', 'altText'], properties: { 
              url: { type: 'string' },
              altText: { type: 'string' }
            } }
          },
          {
            if: { properties: { type: { const: 'resource' } } },
            then: { required: ['resourceType', 'identifier', 'name'], properties: {
              resourceType: { type: 'string' },
              identifier: { type: 'string' },
              name: { type: 'string' }
            } }
          }
        ]
      }
    },
    data: { type: 'object' },
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' }
      }
    }
  },
  allOf: [
    {
      if: { properties: { success: { const: true } } },
      then: { not: { required: ['error'] } }
    },
    {
      if: { properties: { success: { const: false } } },
      then: { required: ['error'] }
    }
  ]
};

const validateMcpResponse = ajv.compile(mcpResponseSchema);

// Use in tests
test('Response should match MCP schema', async () => {
  const response = await myTool({ param: 'value' });
  const valid = validateMcpResponse(response);
  
  if (!valid) {
    console.error('Validation errors:', validateMcpResponse.errors);
  }
  
  expect(valid).toBe(true);
});
```

### 3. Integration Tests with Client Applications

Test how your responses are handled by client applications:

```javascript
describe('Client Integration', () => {
  test('Client should correctly display text response', async () => {
    const mockClient = new MockMcpClient();
    const response = await myTool({ param: 'value' });
    
    mockClient.processResponse(response);
    
    expect(mockClient.displayedText).toContain('Expected text');
  });
  
  test('Client should correctly handle error response', async () => {
    const mockClient = new MockMcpClient();
    const response = await myTool({ triggerError: true });
    
    mockClient.processResponse(response);
    
    expect(mockClient.displayedError).toBe(true);
    expect(mockClient.errorCode).toBe('EXPECTED_ERROR_CODE');
  });
});
```

### 4. Response Format Validation Middleware

Implement middleware that validates all responses before they're sent to clients:

```javascript
function mcpResponseValidationMiddleware(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(body) {
    const response = typeof body === 'string' ? JSON.parse(body) : body;
    
    try {
      // Validate response format
      if (typeof response.success !== 'boolean') {
        console.error('Invalid MCP response: missing success field');
        return originalSend.call(this, {
          success: false,
          timestamp: new Date(),
          content: [{ type: 'text', text: 'Internal server error: Invalid response format' }],
          error: { code: 'INVALID_RESPONSE_FORMAT', message: 'Missing success field' }
        });
      }
      
      if (!Array.isArray(response.content)) {
        console.error('Invalid MCP response: missing content array');
        return originalSend.call(this, {
          success: false,
          timestamp: new Date(),
          content: [{ type: 'text', text: 'Internal server error: Invalid response format' }],
          error: { code: 'INVALID_RESPONSE_FORMAT', message: 'Missing content array' }
        });
      }
      
      // More validation...
      
      // If valid, send the original response
      return originalSend.call(this, body);
    } catch (error) {
      console.error('Error validating MCP response:', error);
      return originalSend.call(this, {
        success: false,
        timestamp: new Date(),
        content: [{ type: 'text', text: 'Internal server error: Response validation failed' }],
        error: { code: 'RESPONSE_VALIDATION_ERROR', message: error.message }
      });
    }
  };
  
  next();
}

// Use in Express app
app.use(mcpResponseValidationMiddleware);
```

### 5. Automated Response Format Auditing

Implement logging and auditing to track response format compliance:

```javascript
function auditMcpResponse(toolName, response) {
  // Check for required fields
  const issues = [];
  
  if (typeof response.success !== 'boolean') {
    issues.push('Missing success field');
  }
  
  if (!Array.isArray(response.content)) {
    issues.push('Missing content array');
  } else if (response.content.length === 0) {
    issues.push('Empty content array');
  } else {
    for (let i = 0; i < response.content.length; i++) {
      const item = response.content[i];
      if (!item.type) {
        issues.push(`Content item ${i} missing type field`);
      }
    }
  }
  
  if (!response.timestamp) {
    issues.push('Missing timestamp');
  }
  
  if (response.success === false && !response.error) {
    issues.push('Error response missing error object');
  }
  
  if (issues.length > 0) {
    console.warn(`MCP response format issues in ${toolName}:`, issues);
    // Log to monitoring system
    monitoringClient.logEvent('mcp_response_format_issue', {
      toolName,
      issues,
      response: JSON.stringify(response)
    });
  }
}

// Use after each tool execution
function wrapWithAudit(toolName, toolFn) {
  return async function(args) {
    const response = await toolFn(args);
    auditMcpResponse(toolName, response);
    return response;
  };
}

// Register tools with auditing
const tools = {
  myTool: wrapWithAudit('myTool', myToolImplementation)
};
```

By following these testing procedures, you can ensure that your MCP tools consistently produce correctly formatted responses that will work reliably with all client applications.