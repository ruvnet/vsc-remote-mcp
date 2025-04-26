#!/bin/bash
set -e

# Default password
export PASSWORD=${PASSWORD:-"password"}

# Function to install extensions
install_extensions() {
  if [ -n "$EXTENSIONS" ]; then
    echo "Installing VS Code extensions..."
    IFS=',' read -ra EXTS <<< "$EXTENSIONS"
    for ext in "${EXTS[@]}"; do
      echo "Installing extension: $ext"
      code-server --install-extension "$ext"
    done
  fi
  
  # Always verify Roo extension is installed
  if ! code-server --list-extensions | grep -q "rooveterinaryinc.roo-cline"; then
    echo "Installing Roo extension..."
    code-server --install-extension rooveterinaryinc.roo-cline
  fi
}

# Install extensions from environment variable
install_extensions

# Start code-server
echo "Starting VS Code Server..."
exec code-server \
  --bind-addr 0.0.0.0:8080 \
  --user-data-dir /home/coder/.config/Code \
  --extensions-dir /home/coder/.local/share/code-server/extensions \
  --disable-telemetry \
  --auth password \
  /home/coder/workspace