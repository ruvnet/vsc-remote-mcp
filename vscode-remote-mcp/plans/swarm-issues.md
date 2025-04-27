# MCP Tools Issues and Fix Plan

## Overview

During testing of the MCP tools from the vsc-remote-node server, several issues were identified with the swarm management tools and the VSCode instance deployment tool. This document outlines these issues and provides a comprehensive plan to fix them.

## Identified Issues

### 1. Swarm Management Tools
- **Issue**: All swarm management tools (`manage_swarm_status`, `manage_swarm_list_instances`, etc.) return an error: `invalid_type, expected: array, received: undefined, path: ["content"], message: Required`
- **Root Cause**: The tools are likely expecting a content array in the response structure, but it's not being properly initialized or returned.

### 2. VSCode Instance Deployment Tool
- **Issue**: The `deploy_vscode_instance` tool fails with error: `Failed to deploy VSCode instance: buildDockerCommand is not defined`
- **Root Cause**: The function `buildDockerCommand` is referenced but not defined in the implementation.

## Fix Plan

### Phase 1: Fix Swarm Management Tools

#### Step 1: Investigate Response Structure
1. Examine the implementation of swarm management tools in `vscode-remote-mcp/src/tools/manage_swarm.js`
2. Identify where the response is being constructed
3. Verify if the content array is being properly initialized and returned

#### Step 2: Fix Response Structure
1. Update the response structure to include the required content array
2. Ensure all swarm management tools follow the same response format
3. Test each tool individually to verify the fix

### Phase 2: Fix VSCode Instance Deployment Tool

#### Step 1: Implement Missing Function
1. Examine the implementation of `deploy_vscode_instance` in `vscode-remote-mcp/src/tools/deploy_vscode_instance.js`
2. Identify where `buildDockerCommand` is being referenced
3. Implement the missing `buildDockerCommand` function

#### Step 2: Test Deployment
1. Test the `deploy_vscode_instance` tool with valid parameters
2. Verify that a VSCode instance is successfully deployed
3. Test stopping the instance with `stop_vscode_instance`

## Implementation Order

1. Fix Swarm Management Tools:
   - `manage_swarm_status`
   - `manage_swarm_list_instances`
   - `manage_swarm_get_instance`
   - Other swarm management tools

2. Fix VSCode Instance Deployment Tool:
   - `deploy_vscode_instance`

## Testing Plan

For each fixed tool:
1. Invoke the tool using the MCP interface
2. Verify the tool executes without errors
3. Validate the response structure and content
4. For deployment tools, verify the actual deployment works as expected

## Success Criteria

- All swarm management tools return a properly structured response without errors
- The VSCode instance deployment tool successfully deploys a new instance
- All tools can be invoked through the MCP interface without errors