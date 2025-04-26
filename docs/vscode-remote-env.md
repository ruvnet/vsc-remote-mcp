To pass environment variables like API keys to a remote VS Code instance (e.g., in a Docker container or SSH environment), use these methods:

## Recommended Approaches

**1. `devcontainer.json` Configuration**  
Add the variable to the `remoteEnv` property in your `.devcontainer/devcontainer.json`:
```json
{
  "remoteEnv": {
    "VSCODE_EXTENSION_API_KEY": "your-api-key-here",
    "OTHER_VAR": "${localEnv:LOCAL_VAR_NAME}"  // Reference local machine vars
  }
}
```
This ensures the variable is available to VS Code and its extensions in the remote environment[5].

**2. `.env` File Integration**  
Create a `.devcontainer/devcontainer.env` file:
```env
VSCODE_EXTENSION_API_KEY=your-api-key-here
```
Then reference it in either:
- **Dockerfile/image setup**:
  ```json
  "runArgs": ["--env-file", ".devcontainer/devcontainer.env"]
  ```
- **Docker Compose**:
  ```yaml
  services:
    your-service:
      env_file: .devcontainer/devcontainer.env
  ```

## Alternative Methods

**3. Shell Configuration**  
Add the export to your remote machine's shell config (e.g., `.bashrc`):
```bash
export VSCODE_EXTENSION_API_KEY="your-api-key-here"
```
*Note:* This requires the VS Code server to load from an interactive shell[3][4].

**4. direnv Extension**  
1. Install the **direnv** extension
2. Create `.envrc` in your project root:
   ```envrc
   export VSCODE_EXTENSION_API_KEY="your-api-key-here"
   ```
3. Run `direnv allow` when prompted[4].

## Verification
After setup, check variables in the VS Code terminal:
```bash
echo $VSCODE_EXTENSION_API_KEY
```
Or access programmatically in extensions using:
```javascript
process.env.VSCODE_EXTENSION_API_KEY
```
 