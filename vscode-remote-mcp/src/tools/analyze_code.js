/**
 * Analyze Code Tool
 * 
 * This tool analyzes code files and provides insights about their structure,
 * complexity, and potential issues.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Analyze a code file
 * @param {Object} params - Tool parameters
 * @param {string} params.file_path - Path to the file to analyze
 * @param {boolean} params.include_metrics - Whether to include complexity metrics (optional, default true)
 * @param {boolean} params.include_structure - Whether to include structure analysis (optional, default true)
 * @param {boolean} params.include_issues - Whether to include potential issues (optional, default true)
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeCode(params) {
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
    
    // Determine file type
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileType = getFileType(fileExtension);
    
    // Analyze based on file type
    const analysis = {
      file_path: filePath,
      file_type: fileType,
      size: {
        bytes: content.length,
        lines: content.split('\n').length
      }
    };
    
    // Include metrics if requested (default true)
    if (params.include_metrics !== false) {
      analysis.metrics = await analyzeMetrics(content, fileType);
    }
    
    // Include structure if requested (default true)
    if (params.include_structure !== false) {
      analysis.structure = analyzeStructure(content, fileType);
    }
    
    // Include issues if requested (default true)
    if (params.include_issues !== false) {
      analysis.issues = analyzeIssues(content, fileType);
    }
    
    // Format output
    let output = `Code Analysis for ${filePath}\n\n`;
    
    output += `File Type: ${fileType}\n`;
    output += `Size: ${analysis.size.bytes} bytes, ${analysis.size.lines} lines\n\n`;
    
    if (analysis.metrics) {
      output += 'Complexity Metrics:\n';
      output += `- Cyclomatic Complexity: ${analysis.metrics.cyclomaticComplexity}\n`;
      output += `- Maintainability Index: ${analysis.metrics.maintainabilityIndex}\n`;
      output += `- Function Count: ${analysis.metrics.functionCount}\n`;
      output += `- Average Function Length: ${analysis.metrics.avgFunctionLength} lines\n\n`;
    }
    
    if (analysis.structure) {
      output += 'Code Structure:\n';
      
      if (analysis.structure.imports && analysis.structure.imports.length > 0) {
        output += '- Imports/Dependencies:\n';
        analysis.structure.imports.forEach(imp => {
          output += `  - ${imp}\n`;
        });
        output += '\n';
      }
      
      if (analysis.structure.functions && analysis.structure.functions.length > 0) {
        output += '- Functions/Methods:\n';
        analysis.structure.functions.forEach(func => {
          output += `  - ${func.name} (Line ${func.line})\n`;
        });
        output += '\n';
      }
      
      if (analysis.structure.classes && analysis.structure.classes.length > 0) {
        output += '- Classes:\n';
        analysis.structure.classes.forEach(cls => {
          output += `  - ${cls.name} (Line ${cls.line})\n`;
        });
        output += '\n';
      }
    }
    
    if (analysis.issues && analysis.issues.length > 0) {
      output += 'Potential Issues:\n';
      analysis.issues.forEach(issue => {
        output += `- ${issue.type}: ${issue.message} (Line ${issue.line})\n`;
      });
      output += '\n';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ],
      analysis
    };
  } catch (error) {
    console.error(`Error in analyzeCode: ${error.message}`);
    return {
      content: [
        {
          type: 'text',
          text: `Error: Failed to analyze code: ${error.message}`
        }
      ],
      error: {
        code: -32603,
        message: `Failed to analyze code: ${error.message}`
      }
    };
  }
}

/**
 * Get file type based on extension
 * @param {string} extension - File extension
 * @returns {string} File type
 */
function getFileType(extension) {
  const typeMap = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.py': 'Python',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.cs': 'C#',
    '.go': 'Go',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.sh': 'Shell Script',
    '.bat': 'Batch Script',
    '.ps1': 'PowerShell'
  };
  
  return typeMap[extension] || 'Unknown';
}

/**
 * Analyze code metrics
 * @param {string} content - File content
 * @param {string} fileType - File type
 * @returns {Promise<Object>} Metrics
 */
async function analyzeMetrics(content, fileType) {
  // Count functions
  const functionMatches = content.match(/function\s+\w+\s*\(|^\s*\w+\s*\([^)]*\)\s*{|^\s*\w+\s*=\s*function|^\s*const\s+\w+\s*=\s*\([^)]*\)\s*=>|class\s+\w+|def\s+\w+\s*\(/gm) || [];
  const functionCount = functionMatches.length;
  
  // Calculate cyclomatic complexity (simplified)
  const conditionalMatches = content.match(/if|else|for|while|switch|case|&&|\|\||catch|try|return|throw/g) || [];
  const cyclomaticComplexity = conditionalMatches.length + 1;
  
  // Calculate maintainability index (simplified)
  const lines = content.split('\n');
  const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')).length;
  const codeLines = lines.length - commentLines;
  const commentRatio = commentLines / (codeLines || 1);
  const maintainabilityIndex = Math.min(100, Math.max(0, 100 - (cyclomaticComplexity * 0.5) + (commentRatio * 15)));
  
  // Calculate average function length
  let avgFunctionLength = 0;
  if (functionCount > 0) {
    // This is a simplified calculation
    avgFunctionLength = Math.round(codeLines / functionCount);
  }
  
  return {
    cyclomaticComplexity,
    maintainabilityIndex: Math.round(maintainabilityIndex),
    functionCount,
    avgFunctionLength
  };
}

/**
 * Analyze code structure
 * @param {string} content - File content
 * @param {string} fileType - File type
 * @returns {Object} Structure analysis
 */
function analyzeStructure(content, fileType) {
  const structure = {
    imports: [],
    functions: [],
    classes: []
  };
  
  const lines = content.split('\n');
  
  // Extract imports
  const importRegexes = {
    'JavaScript': /import\s+.*?from\s+['"](.+?)['"]/g,
    'TypeScript': /import\s+.*?from\s+['"](.+?)['"]/g,
    'Python': /import\s+(\w+)|from\s+(\w+)/g,
    'Java': /import\s+([\w.]+)/g
  };
  
  const requireRegex = /require\s*\(\s*['"](.+?)['"]\s*\)/g;
  
  if (importRegexes[fileType]) {
    let match;
    const regex = importRegexes[fileType];
    while ((match = regex.exec(content)) !== null) {
      structure.imports.push(match[1] || match[2]);
    }
  }
  
  // Also check for require statements in JS/TS
  if (fileType.includes('JavaScript') || fileType.includes('TypeScript')) {
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      structure.imports.push(match[1]);
    }
  }
  
  // Extract functions
  const functionRegexes = {
    'JavaScript': /function\s+(\w+)|const\s+(\w+)\s*=\s*function|const\s+(\w+)\s*=\s*\(.*?\)\s*=>/g,
    'TypeScript': /function\s+(\w+)|const\s+(\w+)\s*=\s*function|const\s+(\w+)\s*=\s*\(.*?\)\s*=>|(\w+)\s*\(.*?\)\s*:\s*\w+/g,
    'Python': /def\s+(\w+)/g,
    'Java': /(?:public|private|protected|static)?\s+\w+\s+(\w+)\s*\(/g
  };
  
  if (functionRegexes[fileType]) {
    let match;
    const regex = functionRegexes[fileType];
    while ((match = regex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3] || match[4];
      if (name) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        structure.functions.push({
          name,
          line: lineNumber
        });
      }
    }
  }
  
  // Extract classes
  const classRegexes = {
    'JavaScript': /class\s+(\w+)/g,
    'TypeScript': /class\s+(\w+)/g,
    'Python': /class\s+(\w+)/g,
    'Java': /class\s+(\w+)/g
  };
  
  if (classRegexes[fileType]) {
    let match;
    const regex = classRegexes[fileType];
    while ((match = regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      structure.classes.push({
        name: match[1],
        line: lineNumber
      });
    }
  }
  
  return structure;
}

/**
 * Analyze code for potential issues
 * @param {string} content - File content
 * @param {string} fileType - File type
 * @returns {Array} Issues
 */
function analyzeIssues(content, fileType) {
  const issues = [];
  const lines = content.split('\n');
  
  // Check for TODO comments
  lines.forEach((line, index) => {
    if (line.includes('TODO') || line.includes('FIXME')) {
      issues.push({
        type: 'Comment',
        message: `Found TODO/FIXME comment: "${line.trim()}"`,
        line: index + 1
      });
    }
  });
  
  // Check for console.log statements in JS/TS
  if (fileType.includes('JavaScript') || fileType.includes('TypeScript')) {
    lines.forEach((line, index) => {
      if (line.includes('console.log')) {
        issues.push({
          type: 'Debug Code',
          message: 'Found console.log statement that might need to be removed',
          line: index + 1
        });
      }
    });
  }
  
  // Check for long lines
  lines.forEach((line, index) => {
    if (line.length > 100) {
      issues.push({
        type: 'Style',
        message: `Line exceeds 100 characters (${line.length})`,
        line: index + 1
      });
    }
  });
  
  // Check for long functions (simplified)
  let inFunction = false;
  let functionStartLine = 0;
  let functionName = '';
  let bracketCount = 0;
  let functionLines = 0;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Very simplified function detection
    if (!inFunction && 
        (trimmedLine.startsWith('function ') || 
         trimmedLine.includes(' function(') || 
         trimmedLine.includes(' function (') ||
         trimmedLine.includes(') {'))) {
      inFunction = true;
      functionStartLine = index + 1;
      functionName = trimmedLine.match(/function\s+(\w+)/) ? 
                     trimmedLine.match(/function\s+(\w+)/)[1] : 
                     'anonymous';
      bracketCount = 0;
      functionLines = 0;
    }
    
    if (inFunction) {
      functionLines++;
      
      // Count brackets for simple function end detection
      bracketCount += (line.match(/{/g) || []).length;
      bracketCount -= (line.match(/}/g) || []).length;
      
      if (bracketCount <= 0 && functionLines > 0) {
        inFunction = false;
        
        // Check if function is too long
        if (functionLines > 50) {
          issues.push({
            type: 'Complexity',
            message: `Function "${functionName}" is too long (${functionLines} lines)`,
            line: functionStartLine
          });
        }
      }
    }
  });
  
  return issues;
}

module.exports = analyzeCode;