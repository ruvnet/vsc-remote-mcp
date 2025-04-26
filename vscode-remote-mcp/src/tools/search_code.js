/**
 * Search Code Tool
 * 
 * This tool searches for patterns in code files and returns matching results with context.
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

/**
 * Search for patterns in code files
 * @param {Object} params - Tool parameters
 * @param {string} params.pattern - Pattern to search for
 * @param {string} params.directory - Directory to search in (default: .)
 * @param {string} params.file_pattern - File pattern to match (default: *)
 * @param {number} params.context_lines - Number of context lines to include (default: 2)
 * @param {number} params.max_results - Maximum number of results to return (default: 100)
 * @param {boolean} params.ignore_case - Whether to ignore case (default: false)
 * @param {boolean} params.use_regex - Whether to use regex (default: true)
 * @returns {Promise<Object>} Search results
 */
async function searchCode(params) {
  if (!params.pattern) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: pattern parameter is required'
        }
      ],
      error: {
        code: -32602,
        message: 'pattern parameter is required'
      }
    };
  }

  try {
    const directory = params.directory || '.';
    const filePattern = params.file_pattern || '*';
    const contextLines = params.context_lines !== undefined ? params.context_lines : 2;
    const maxResults = params.max_results || 100;
    const ignoreCase = params.ignore_case || false;
    const useRegex = params.use_regex !== false; // Default to true
    
    // Build grep command
    let grepCommand = 'grep';
    
    if (useRegex) {
      grepCommand += ' -E'; // Use extended regex
    } else {
      grepCommand += ' -F'; // Use fixed strings
    }
    
    if (ignoreCase) {
      grepCommand += ' -i'; // Ignore case
    }
    
    grepCommand += ` -n`; // Show line numbers
    
    if (contextLines > 0) {
      grepCommand += ` -A ${contextLines} -B ${contextLines}`; // Add context lines
    }
    
    // Escape pattern for shell
    const escapedPattern = params.pattern.replace(/'/g, "'\\''");
    
    // Build find command to get files matching pattern
    const findCommand = `find ${directory} -type f -name "${filePattern}" -not -path "*/node_modules/*" -not -path "*/\\.git/*"`;
    
    // Combine find and grep
    const command = `${findCommand} -print0 | xargs -0 ${grepCommand} '${escapedPattern}' 2>/dev/null`;
    
    // Execute command
    const { stdout } = await execAsync(command);
    
    // Parse results
    const results = parseGrepResults(stdout, contextLines, maxResults);
    
    // Format output for display
    let output = `Search Results for "${params.pattern}"\n\n`;
    output += `Directory: ${directory}\n`;
    output += `File Pattern: ${filePattern}\n`;
    output += `Results Found: ${results.length}\n\n`;
    
    if (results.length > 0) {
      results.forEach((result, index) => {
        output += `Match ${index + 1}: ${result.file}:${result.line}\n`;
        
        // Add lines before
        if (result.lines_before && result.lines_before.length > 0) {
          result.lines_before.forEach(line => {
            output += `  ${line.line}: ${line.content}\n`;
          });
        }
        
        // Add the matching line
        output += `> ${result.line}: ${result.content}\n`;
        
        // Add lines after
        if (result.lines_after && result.lines_after.length > 0) {
          result.lines_after.forEach(line => {
            output += `  ${line.line}: ${line.content}\n`;
          });
        }
        
        output += '\n';
      });
    } else {
      output += 'No matches found.\n';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ],
      pattern: params.pattern,
      directory,
      file_pattern: filePattern,
      results
    };
  } catch (error) {
    console.error(`Error in searchCode: ${error.message}`);
    
    // If grep doesn't find anything, it returns with exit code 1
    if (error.code === 1 && error.stdout === '') {
      return {
        content: [
          {
            type: 'text',
            text: `Search Results for "${params.pattern}"\n\nNo matches found.`
          }
        ],
        pattern: params.pattern,
        directory: params.directory || '.',
        file_pattern: params.file_pattern || '*',
        results: []
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error searching for "${params.pattern}": ${error.message}`
        }
      ],
      error: {
        code: -32603,
        message: `Failed to search code: ${error.message}`
      }
    };
  }
}

/**
 * Parse grep results
 * @param {string} stdout - Grep command output
 * @param {number} contextLines - Number of context lines
 * @param {number} maxResults - Maximum number of results
 * @returns {Array<Object>} Parsed results
 */
function parseGrepResults(stdout, contextLines, maxResults) {
  if (!stdout.trim()) {
    return [];
  }
  
  const results = [];
  let currentFile = null;
  let currentMatch = null;
  let linesBefore = [];
  let linesAfter = [];
  let matchCount = 0;
  
  // Split output by lines
  const lines = stdout.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line.trim()) {
      continue;
    }
    
    // Check if this is a file separator line
    if (line.startsWith('--')) {
      // Save previous match if exists
      if (currentMatch) {
        currentMatch.lines_after = linesAfter;
        results.push(currentMatch);
        matchCount++;
        
        if (matchCount >= maxResults) {
          break;
        }
      }
      
      // Reset lines after
      linesAfter = [];
      continue;
    }
    
    // Parse line
    const match = line.match(/^([^:]+):(\d+):(.*)/);
    
    if (match) {
      const [, filePath, lineNumber, content] = match;
      
      // Check if this is a new file
      if (filePath !== currentFile) {
        // Save previous match if exists
        if (currentMatch) {
          currentMatch.lines_after = linesAfter;
          results.push(currentMatch);
          matchCount++;
          
          if (matchCount >= maxResults) {
            break;
          }
        }
        
        currentFile = filePath;
        linesBefore = [];
        linesAfter = [];
      }
      
      // Create new match
      currentMatch = {
        file: filePath,
        line: parseInt(lineNumber, 10),
        content: content,
        lines_before: linesBefore,
        lines_after: []
      };
      
      // Reset lines
      linesBefore = [];
    } else {
      // Check if this is a context line
      const contextMatch = line.match(/^([^-]*)(-|\:)(\d+)(-|\:)(.*)/);
      
      if (contextMatch) {
        const [, filePath, , lineNumber, , content] = contextMatch;
        
        // Check if this is a before or after context line
        if (currentMatch) {
          // This is an after context line
          linesAfter.push({
            line: parseInt(lineNumber, 10),
            content: content
          });
        } else {
          // This is a before context line
          linesBefore.push({
            line: parseInt(lineNumber, 10),
            content: content
          });
        }
      }
    }
  }
  
  // Save last match if exists
  if (currentMatch && matchCount < maxResults) {
    currentMatch.lines_after = linesAfter;
    results.push(currentMatch);
  }
  
  return results;
}

module.exports = searchCode;