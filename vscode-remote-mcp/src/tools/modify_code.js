/**
 * Modify Code Tool
 * 
 * This tool modifies code files with various operations like adding, updating,
 * or removing code segments.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Modify a code file
 * @param {Object} params - Tool parameters
 * @param {string} params.file_path - Path to the file to modify
 * @param {string} params.operation - Operation to perform (add, update, remove, replace)
 * @param {Object} params.position - Position to perform the operation at
 * @param {string} params.content - Content to add or update
 * @param {string} params.pattern - Pattern to match for update or remove operations
 * @param {Object} params.range - Range of lines to modify
 * @returns {Promise<Object>} Modification results
 */
async function modifyCode(params) {
  if (!params.file_path) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: file_path parameter is required'
        }
      ],
      error: {
        code: -32602,
        message: 'file_path parameter is required'
      }
    };
  }

  if (!params.operation) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: operation parameter is required'
        }
      ],
      error: {
        code: -32602,
        message: 'operation parameter is required'
      }
    };
  }

  try {
    const filePath = path.resolve(params.file_path);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: File not found: ${filePath}`
          }
        ],
        error: {
          code: -32602,
          message: `File not found: ${filePath}`
        }
      };
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    let modifiedContent;
    let modificationDetails;
    
    // Perform operation
    switch (params.operation) {
      case 'add':
        modifiedContent = await addContent(lines, params);
        modificationDetails = {
          operation: 'add',
          position: params.position,
          content_length: params.content.split('\n').length
        };
        break;
        
      case 'update':
        modifiedContent = await updateContent(lines, params);
        modificationDetails = {
          operation: 'update',
          position: params.position,
          pattern: params.pattern,
          content_length: params.content.split('\n').length
        };
        break;
        
      case 'remove':
        modifiedContent = await removeContent(lines, params);
        modificationDetails = {
          operation: 'remove',
          position: params.position,
          pattern: params.pattern,
          range: params.range
        };
        break;
        
      case 'replace':
        modifiedContent = await replaceContent(lines, params);
        modificationDetails = {
          operation: 'replace',
          range: params.range,
          content_length: params.content.split('\n').length
        };
        break;
        
      default:
        return {
          content: [
            {
              type: 'text',
              text: `Error: Invalid operation: ${params.operation}`
            }
          ],
          error: {
            code: -32602,
            message: `Invalid operation: ${params.operation}`
          }
        };
    }
    
    // Write modified content back to file
    await fs.writeFile(filePath, modifiedContent.join('\n'));
    
    // Format output for display
    let output = `Code Modification Results\n\n`;
    output += `File: ${filePath}\n`;
    output += `Operation: ${params.operation}\n`;
    output += `Modification Details: ${JSON.stringify(modificationDetails, null, 2)}\n`;
    
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ],
      success: true,
      file_path: filePath,
      modification: modificationDetails
    };
  } catch (error) {
    console.error(`Error in modifyCode: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: `Error: Failed to modify code: ${error.message}`
        }
      ],
      error: {
        code: -32603,
        message: `Failed to modify code: ${error.message}`
      }
    };
  }
}

/**
 * Add content to a file
 * @param {Array<string>} lines - File lines
 * @param {Object} params - Tool parameters
 * @returns {Promise<Array<string>>} Modified lines
 */
async function addContent(lines, params) {
  const position = params.position || { line: lines.length + 1 };
  const lineIndex = position.line - 1;
  
  if (lineIndex < 0 || lineIndex > lines.length) {
    throw new Error(`Invalid line number: ${position.line}`);
  }
  
  const contentLines = params.content.split('\n');
  
  // Insert content at specified line
  const modifiedLines = [
    ...lines.slice(0, lineIndex),
    ...contentLines,
    ...lines.slice(lineIndex)
  ];
  
  return modifiedLines;
}

/**
 * Update content in a file
 * @param {Array<string>} lines - File lines
 * @param {Object} params - Tool parameters
 * @returns {Promise<Array<string>>} Modified lines
 */
async function updateContent(lines, params) {
  let modifiedLines = [...lines];
  
  if (params.pattern) {
    // Update content based on pattern
    const pattern = new RegExp(params.pattern);
    let found = false;
    
    for (let i = 0; i < modifiedLines.length; i++) {
      if (pattern.test(modifiedLines[i])) {
        const contentLines = params.content.split('\n');
        modifiedLines.splice(i, 1, ...contentLines);
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error(`Pattern not found: ${params.pattern}`);
    }
  } else if (params.position) {
    // Update content at specified position
    const lineIndex = params.position.line - 1;
    
    if (lineIndex < 0 || lineIndex >= modifiedLines.length) {
      throw new Error(`Invalid line number: ${params.position.line}`);
    }
    
    const contentLines = params.content.split('\n');
    modifiedLines.splice(lineIndex, 1, ...contentLines);
  } else {
    throw new Error('Either pattern or position is required for update operation');
  }
  
  return modifiedLines;
}

/**
 * Remove content from a file
 * @param {Array<string>} lines - File lines
 * @param {Object} params - Tool parameters
 * @returns {Promise<Array<string>>} Modified lines
 */
async function removeContent(lines, params) {
  let modifiedLines = [...lines];
  
  if (params.pattern) {
    // Remove content based on pattern
    const pattern = new RegExp(params.pattern);
    let found = false;
    
    for (let i = 0; i < modifiedLines.length; i++) {
      if (pattern.test(modifiedLines[i])) {
        modifiedLines.splice(i, 1);
        found = true;
        break;
      }
    }
    
    if (!found) {
      throw new Error(`Pattern not found: ${params.pattern}`);
    }
  } else if (params.range) {
    // Remove content in specified range
    const startIndex = params.range.start_line - 1;
    const endIndex = params.range.end_line - 1;
    
    if (startIndex < 0 || startIndex >= modifiedLines.length) {
      throw new Error(`Invalid start line: ${params.range.start_line}`);
    }
    
    if (endIndex < startIndex || endIndex >= modifiedLines.length) {
      throw new Error(`Invalid end line: ${params.range.end_line}`);
    }
    
    modifiedLines.splice(startIndex, endIndex - startIndex + 1);
  } else if (params.position) {
    // Remove content at specified position
    const lineIndex = params.position.line - 1;
    
    if (lineIndex < 0 || lineIndex >= modifiedLines.length) {
      throw new Error(`Invalid line number: ${params.position.line}`);
    }
    
    modifiedLines.splice(lineIndex, 1);
  } else {
    throw new Error('Either pattern, range, or position is required for remove operation');
  }
  
  return modifiedLines;
}

/**
 * Replace content in a file
 * @param {Array<string>} lines - File lines
 * @param {Object} params - Tool parameters
 * @returns {Promise<Array<string>>} Modified lines
 */
async function replaceContent(lines, params) {
  if (!params.range) {
    throw new Error('Range is required for replace operation');
  }
  
  if (!params.content) {
    throw new Error('Content is required for replace operation');
  }
  
  const startIndex = params.range.start_line - 1;
  const endIndex = params.range.end_line - 1;
  
  if (startIndex < 0 || startIndex >= lines.length) {
    throw new Error(`Invalid start line: ${params.range.start_line}`);
  }
  
  if (endIndex < startIndex || endIndex >= lines.length) {
    throw new Error(`Invalid end line: ${params.range.end_line}`);
  }
  
  const contentLines = params.content.split('\n');
  
  // Replace content in specified range
  const modifiedLines = [
    ...lines.slice(0, startIndex),
    ...contentLines,
    ...lines.slice(endIndex + 1)
  ];
  
  return modifiedLines;
}

module.exports = modifyCode;