# Docker Provider Implementation Plan

## 1. Docker Provider Overview

### 1.1 Core Responsibilities

The Docker Provider is a critical component in the VSCode Remote Swarm architecture, responsible for managing VSCode instances as Docker containers. Its core responsibilities include:

- **Container Lifecycle Management**: Creating, starting, stopping, and deleting Docker containers that run VSCode instances
- **Resource Management**: Allocating and monitoring CPU, memory, and storage resources for containers
- **Network Configuration**: Setting up network connectivity for secure access to VSCode instances
- **Volume Management**: Creating and mounting volumes for persistent workspace storage
- **Health Monitoring**: Checking container health and reporting status to the Swarm Controller
- **State Persistence**: Storing container state and metadata for recovery and management

### 1.2 Integration with Docker API

The Docker Provider integrates with the Docker API through a command-based approach:

```typescript
// Docker command execution through child_process
const execAsync = promisify(exec);
const result = await execAsync(`docker ${command}`);
```

This approach provides several benefits:
- No external dependencies on Docker client libraries
- Works with any Docker installation without version compatibility issues
- Simple implementation that's easy to maintain and debug

The Docker Provider uses a layered architecture for Docker API integration:
1. **DockerCommandExecutor**: Low-level command execution
2. **ContainerUtils**: Container-specific operations
3. **DockerProvider**: High-level provider interface implementation

### 1.3 Configuration Requirements

The Docker Provider requires the following configuration:

```typescript
export interface DockerProviderConfig {
  // Docker socket path for API communication
  socketPath: string;
  
  // Docker API version
  apiVersion: string;
  
  // Docker network name for container isolation
  networkName: string;
  
  // Docker volume driver for persistent storage
  volumeDriver: string;
  
  // Docker image repository for VSCode instances
  imageRepository: string;
  
  // Docker image tag
  imageTag: string;
}
```

Default configuration values:
- Socket Path: `/var/run/docker.sock`
- API Version: `1.41`
- Network Name: `vscode-remote-network`
- Volume Driver: `local`
- Image Repository: `codercom/code-server`
- Image Tag: `latest`

## 2. Implementation Steps

### 2.1 Container Management

#### 2.1.1 Container Creation

Container creation involves several steps:

1. **Validate Configuration**: Ensure the instance configuration is valid
2. **Generate Instance ID**: Create a unique identifier for the instance
3. **Build Docker Command**: Construct the Docker create command with appropriate parameters
4. **Execute Command**: Run the Docker command to create the container
5. **Store Metadata**: Save container ID and other metadata

```typescript
// Container creation pseudocode
public async createContainer(name: string, config: InstanceConfig): Promise<string> {
  // Build Docker run command with appropriate parameters
  let command = 'create';
  command += ` --name ${name}`;
  command += ` --network ${this.config.networkName}`;
  command += ` --cpus ${config.resources.cpu.cores}`;
  command += ` --memory ${config.resources.memory.min}m`;
  
  // Add port mappings
  if (config.network.port) {
    command += ` -p ${config.network.port}:8080`;
  }
  
  // Add volume mount
  command += ` -v ${config.workspacePath}:/home/coder/project`;
  
  // Add environment variables
  for (const [key, value] of Object.entries(config.env || {})) {
    command += ` -e ${key}=${value}`;
  }
  
  // Add image
  command += ` ${this.config.imageRepository}:${this.config.imageTag}`;
  
  // Execute command and return container ID
  const { stdout } = await this.dockerExecutor.execute(command);
  return stdout.trim();
}
```

#### 2.1.2 Container Startup

Starting a container requires:

1. **Validate Container**: Ensure the container exists
2. **Execute Start Command**: Run the Docker start command
3. **Update Instance Status**: Mark the instance as running
4. **Retrieve Network Information**: Get IP address and port mappings
5. **Generate Access URLs**: Create URLs for accessing the VSCode instance

```typescript
// Container startup pseudocode
public async startContainer(containerId: string): Promise<boolean> {
  await this.dockerExecutor.execute(`start ${containerId}`);
  return true;
}
```

#### 2.1.3 Container Stopping

Stopping a container involves:

1. **Validate Container**: Ensure the container exists and is running
2. **Execute Stop Command**: Run the Docker stop command (or kill for force stop)
3. **Update Instance Status**: Mark the instance as stopped

```typescript
// Container stopping pseudocode
public async stopContainer(containerId: string, force = false): Promise<boolean> {
  if (force) {
    await this.dockerExecutor.execute(`kill ${containerId}`);
  } else {
    await this.dockerExecutor.execute(`stop ${containerId}`);
  }
  return true;
}
```

#### 2.1.4 Container Deletion

Deleting a container requires:

1. **Validate Container**: Ensure the container exists
2. **Stop Container**: Stop the container if it's running
3. **Execute Remove Command**: Run the Docker rm command
4. **Update Instance Status**: Mark the instance as deleted

```typescript
// Container deletion pseudocode
public async removeContainer(containerId: string): Promise<boolean> {
  await this.dockerExecutor.execute(`rm -f ${containerId}`);
  return true;
}
```

### 2.2 Volume Management

#### 2.2.1 Volume Creation Strategy

Volumes are essential for persisting VSCode workspaces. The implementation will support:

1. **Named Volumes**: Docker-managed volumes with specific names
2. **Host Path Mounts**: Direct mounting of host directories
3. **Volume Drivers**: Support for different volume drivers (local, nfs, etc.)

```typescript
// Volume creation pseudocode
public async createVolume(name: string): Promise<string> {
  const command = `volume create --driver ${this.config.volumeDriver} ${name}`;
  const { stdout } = await this.dockerExecutor.execute(command);
  return stdout.trim();
}
```

#### 2.2.2 Volume Mounting

Volumes are mounted during container creation:

```typescript
// Volume mounting (part of container creation)
// Host path mount
command += ` -v ${config.workspacePath}:/home/coder/project`;

// Named volume mount
command += ` -v ${volumeName}:/home/coder/project`;
```

#### 2.2.3 Volume Persistence

Volumes persist independently of containers, allowing for:

1. **Container Restarts**: Data persists when containers are restarted
2. **Container Recreation**: Data persists when containers are recreated
3. **Instance Migration**: Data can be migrated between instances

#### 2.2.4 Volume Cleanup

Volumes should be cleaned up when instances are deleted:

```typescript
// Volume cleanup pseudocode
public async removeVolume(volumeName: string): Promise<boolean> {
  await this.dockerExecutor.execute(`volume rm ${volumeName}`);
  return true;
}
```

### 2.3 Network Configuration

#### 2.3.1 Network Creation

A dedicated Docker network is created for VSCode instances:

```typescript
// Network creation pseudocode
public async createNetwork(networkName: string): Promise<boolean> {
  await this.dockerExecutor.execute(`network create ${networkName}`);
  return true;
}
```

#### 2.3.2 Port Mapping

Ports are mapped during container creation:

```typescript
// Port mapping (part of container creation)
command += ` -p ${config.network.port}:8080`;
```

#### 2.3.3 Network Isolation

Containers are isolated in a dedicated network:

```typescript
// Network isolation (part of container creation)
command += ` --network ${this.config.networkName}`;
```

#### 2.3.4 Access URL Generation

Access URLs are generated based on port mappings:

```typescript
// Access URL generation pseudocode
private generateAccessUrls(instance: VSCodeInstance): string[] {
  const urls: string[] = [];
  
  // Find HTTP port
  const httpPort = instance.network.ports.find(port => port.internal === 8080);
  
  if (httpPort) {
    urls.push(`http://localhost:${httpPort.external}`);
    
    // Add hostname URL if not localhost
    if (instance.network.externalIp !== 'localhost') {
      urls.push(`http://${instance.network.externalIp}:${httpPort.external}`);
    }
  }
  
  return urls;
}
```

### 2.4 Resource Allocation

#### 2.4.1 CPU Limits

CPU limits are set during container creation:

```typescript
// CPU limits (part of container creation)
command += ` --cpus ${config.resources.cpu.cores}`;
```

#### 2.4.2 Memory Limits

Memory limits are set during container creation:

```typescript
// Memory limits (part of container creation)
command += ` --memory ${config.resources.memory.min}m`;
```

#### 2.4.3 Storage Limits

Storage limits can be set for volumes:

```typescript
// Storage limits (part of volume creation)
command += ` --opt size=${config.resources.storage.size}g`;
```

#### 2.4.4 Resource Monitoring

Resource usage is monitored using Docker stats:

```typescript
// Resource monitoring pseudocode
public async getContainerStats(containerId: string): Promise<{ cpu: number; memory: number }> {
  const { stdout } = await this.dockerExecutor.execute(`stats ${containerId} --no-stream --format "{{.CPUPerc}},{{.MemUsage}}"`);
  const [cpuPerc, memUsage] = stdout.split(',');
  
  // Parse CPU percentage
  const cpu = parseFloat(cpuPerc.replace('%', '')) / 100;
  
  // Parse memory usage
  const memMatch = memUsage.match(/([0-9.]+)([A-Za-z]+)/);
  let memory = 0;
  
  if (memMatch) {
    // Convert to MB based on unit
    // Implementation details...
  }
  
  return { cpu, memory };
}
```

## 3. Docker Command Utilities

### 3.1 Command Construction Helpers

The Docker Provider includes utilities for constructing Docker commands:

```typescript
// Command construction helper pseudocode
export class DockerCommandBuilder {
  private command: string[] = [];
  
  constructor(baseCommand: string) {
    this.command.push(baseCommand);
  }
  
  public addFlag(flag: string): DockerCommandBuilder {
    this.command.push(flag);
    return this;
  }
  
  public addOption(option: string, value: string): DockerCommandBuilder {
    this.command.push(`${option} ${value}`);
    return this;
  }
  
  public addEnvironmentVariable(key: string, value: string): DockerCommandBuilder {
    this.command.push(`-e ${key}=${value}`);
    return this;
  }
  
  public addPortMapping(hostPort: number, containerPort: number): DockerCommandBuilder {
    this.command.push(`-p ${hostPort}:${containerPort}`);
    return this;
  }
  
  public addVolumeMapping(hostPath: string, containerPath: string): DockerCommandBuilder {
    this.command.push(`-v ${hostPath}:${containerPath}`);
    return this;
  }
  
  public build(): string {
    return this.command.join(' ');
  }
}
```

### 3.2 Output Parsing Utilities

Utilities for parsing Docker command output:

```typescript
// Output parsing utility pseudocode
export class DockerOutputParser {
  public static parseContainerInspect(output: string): any {
    return JSON.parse(output)[0];
  }
  
  public static parseContainerStats(output: string): { cpu: number; memory: number } {
    const [cpuPerc, memUsage] = output.split(',');
    
    // Parse CPU percentage
    const cpu = parseFloat(cpuPerc.replace('%', '')) / 100;
    
    // Parse memory usage
    // Implementation details...
    
    return { cpu, memory };
  }
  
  public static parseContainerLogs(output: string): string[] {
    return output.split('\n').filter(line => line.trim() !== '');
  }
}
```

### 3.3 Error Handling Strategies

Error handling strategies for Docker commands:

```typescript
// Error handling pseudocode
public async execute(command: string): Promise<CommandResult> {
  try {
    const result = await execAsync(`docker ${command}`);
    return result;
  } catch (error) {
    const err = error as Error & { stdout?: string; stderr?: string };
    
    // Return stdout and stderr even if command fails
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || err.message
    };
  }
}
```

Common error scenarios and handling:

1. **Container Not Found**: Check if container exists before operations
2. **Permission Denied**: Ensure Docker socket has appropriate permissions
3. **Resource Constraints**: Handle resource allocation failures
4. **Network Issues**: Handle network creation and connectivity failures
5. **Image Pull Failures**: Handle image pull failures with appropriate retries

## 4. Container Management

### 4.1 Lifecycle Management

The container lifecycle is managed through several states:

1. **Created**: Container is created but not started
2. **Running**: Container is running
3. **Stopped**: Container is stopped
4. **Deleted**: Container is removed

State transitions are handled by the Docker Provider:

```typescript
// Lifecycle management pseudocode
public async createInstance(config: InstanceConfig): Promise<VSCodeInstance> {
  // Create container
  const containerId = await this.containerUtils.createContainer(instance.name, config);
  
  // Start container
  await this.containerUtils.startContainer(containerId);
  
  // Update instance status
  instance.status = InstanceStatus.RUNNING;
  
  // Save instance
  await this.instanceStorage.saveInstance(instance);
  
  return instance;
}
```

### 4.2 Health Checking

Container health is checked using Docker inspect and stats:

```typescript
// Health checking pseudocode
public async checkContainerHealth(containerId: string): Promise<boolean> {
  // Check if container is running
  const isRunning = await this.dockerExecutor.isContainerRunning(containerId);
  
  if (!isRunning) {
    return false;
  }
  
  // Check if container is healthy
  const { stdout } = await this.dockerExecutor.execute(`inspect --format='{{.State.Health.Status}}' ${containerId}`);
  
  return stdout.trim() === 'healthy';
}
```

Health check implementation includes:
1. **Container Status**: Check if container is running
2. **Health Status**: Check container health status if available
3. **Resource Usage**: Check if resource usage is within limits
4. **Service Availability**: Check if VSCode service is responding

### 4.3 Log Collection

Container logs are collected using Docker logs:

```typescript
// Log collection pseudocode
public async getContainerLogs(
  containerId: string,
  options?: {
    lines?: number;
    since?: Date;
    follow?: boolean;
  }
): Promise<string> {
  // Build Docker logs command
  let command = `logs ${containerId}`;
  
  if (options) {
    if (options.lines) {
      command += ` --tail ${options.lines}`;
    }
    
    if (options.since) {
      command += ` --since ${Math.floor(options.since.getTime() / 1000)}`;
    }
    
    if (options.follow) {
      command += ' --follow';
    }
  }
  
  // Execute command
  const { stdout } = await this.dockerExecutor.execute(command);
  
  return stdout;
}
```

### 4.4 Log Analysis

Logs are analyzed to detect issues:

```typescript
// Log analysis pseudocode
export class DockerLogParser {
  public parseDockerLogs(logs: string, pattern?: string): LogEntry[] {
    const lines = logs.split('\n');
    const entries: LogEntry[] = [];
    
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      
      // Parse log entry
      const entry = this.parseLogLine(line);
      
      // Filter by pattern if provided
      if (pattern && !entry.message.includes(pattern)) {
        continue;
      }
      
      entries.push(entry);
    }
    
    return entries;
  }
  
  private parseLogLine(line: string): LogEntry {
    // Implementation details...
  }
}
```

## 5. State Persistence

### 5.1 Container State Tracking

Container state is tracked using a combination of:
1. **In-Memory State**: Current state during runtime
2. **Persistent State**: State stored in files
3. **Docker State**: State queried from Docker

```typescript
// Container state tracking pseudocode
public async updateInstanceState(instance: VSCodeInstance): Promise<VSCodeInstance> {
  // Get container info
  const metadata = instance.metadata as DockerInstanceMetadata;
  const containerInfo = await this.containerUtils.getContainerInfo(metadata.containerId);
  
  // Update instance status
  instance.status = this.containerUtils.mapContainerStatusToInstanceStatus(containerInfo.state);
  
  // Update instance network info
  instance.network.internalIp = containerInfo.networkSettings.ipAddress;
  instance.network.ports = containerInfo.networkSettings.ports.map(port => ({
    internal: port.internal,
    external: port.external,
    protocol: port.protocol
  }));
  
  // Update instance resource usage
  instance.resources.cpu.used = containerInfo.stats.cpuUsage;
  instance.resources.memory.used = containerInfo.stats.memoryUsage;
  
  // Update timestamp
  instance.updatedAt = new Date();
  
  // Save instance
  await this.instanceStorage.saveInstance(instance);
  
  return instance;
}
```

### 5.2 Restart Recovery

Restart recovery is handled by:
1. **Loading Instances**: Loading instance data from files
2. **Checking Containers**: Checking if containers exist and are running
3. **Updating State**: Updating instance state based on container state

```typescript
// Restart recovery pseudocode
public async recoverInstances(): Promise<void> {
  // Load all instances
  const instances = await this.instanceStorage.loadAllInstances();
  
  for (const instance of instances) {
    // Skip deleted instances
    if (instance.status === InstanceStatus.DELETED) {
      continue;
    }
    
    // Get container ID
    const metadata = instance.metadata as DockerInstanceMetadata;
    
    // Check if container exists
    const containerExists = await this.dockerExecutor.containerExists(metadata.containerId);
    
    if (!containerExists) {
      // Container doesn't exist, mark as failed
      instance.status = InstanceStatus.FAILED;
      await this.instanceStorage.saveInstance(instance);
      continue;
    }
    
    // Update instance state
    await this.updateInstanceState(instance);
  }
}
```

### 5.3 Instance Metadata Storage

Instance metadata is stored in JSON files:

```typescript
// Instance metadata storage pseudocode
public async saveInstance(instance: VSCodeInstance): Promise<void> {
  const filePath = path.join(this.storagePath, `${instance.id}.json`);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(instance, null, 2));
  } catch (error) {
    throw new Error(`Failed to save instance: ${error.message}`);
  }
}
```

The storage implementation includes:
1. **File-Based Storage**: Each instance is stored in a separate JSON file
2. **Atomic Updates**: File updates are performed atomically
3. **Error Handling**: Robust error handling for file operations
4. **Serialization**: Proper serialization and deserialization of instance data

## 6. Security Measures

### 6.1 Network Isolation

Network isolation is implemented using Docker networks:

```typescript
// Network isolation pseudocode
public async initialize(): Promise<void> {
  // Create Docker network if it doesn't exist
  const networkExists = await this.dockerExecutor.networkExists(this.config.networkName);
  
  if (!networkExists) {
    await this.dockerExecutor.createNetwork(this.config.networkName);
  }
}
```

Network isolation features:
1. **Dedicated Network**: Containers run in a dedicated Docker network
2. **Internal Communication**: Containers can communicate with each other
3. **External Access Control**: External access is controlled through port mappings
4. **DNS Resolution**: Containers can resolve each other by name

### 6.2 Resource Limiting

Resource limits are enforced using Docker resource constraints:

```typescript
// Resource limiting (part of container creation)
command += ` --cpus ${config.resources.cpu.cores}`;
command += ` --memory ${config.resources.memory.min}m`;
command += ` --pids-limit 1000`;
```

Resource limiting features:
1. **CPU Limits**: Limit CPU usage to prevent resource starvation
2. **Memory Limits**: Limit memory usage to prevent out-of-memory issues
3. **Process Limits**: Limit number of processes to prevent fork bombs
4. **Storage Limits**: Limit storage usage to prevent disk space exhaustion

### 6.3 Container Hardening

Container hardening measures:

```typescript
// Container hardening (part of container creation)
command += ` --security-opt no-new-privileges`;
command += ` --cap-drop ALL`;
command += ` --cap-add NET_BIND_SERVICE`;
```

Container hardening features:
1. **No New Privileges**: Prevent privilege escalation
2. **Capability Dropping**: Drop all capabilities by default
3. **Minimal Capabilities**: Add only required capabilities
4. **Read-Only Root**: Mount root filesystem as read-only where possible
5. **User Namespaces**: Use user namespaces for additional isolation

## 7. Local Development Setup

### 7.1 Requirements for Local Development

Local development requires:
1. **Docker**: Docker Engine installed and running
2. **Node.js**: Node.js 14+ for running the application
3. **TypeScript**: TypeScript for development
4. **VSCode**: VSCode for development (optional)

### 7.2 Testing Environments

Testing environments include:
1. **Unit Tests**: Tests for individual components
2. **Integration Tests**: Tests for component integration
3. **End-to-End Tests**: Tests for complete workflows

```typescript
// Unit test example pseudocode
describe('DockerCommandExecutor', () => {
  let executor: DockerCommandExecutor;
  
  beforeEach(() => {
    executor = new DockerCommandExecutor();
  });
  
  it('should execute Docker commands', async () => {
    // Mock exec function
    jest.spyOn(childProcess, 'exec').mockImplementation((command, callback) => {
      callback(null, { stdout: 'success', stderr: '' });
      return {} as any;
    });
    
    const result = await executor.execute('version');
    
    expect(result.stdout).toBe('success');
    expect(result.stderr).toBe('');
  });
});
```

### 7.3 Debugging Approaches

Debugging approaches include:
1. **Logging**: Comprehensive logging for troubleshooting
2. **Inspection**: Container inspection for state analysis
3. **Log Analysis**: Log analysis for issue detection
4. **Direct Shell Access**: Shell access to containers for debugging

```typescript
// Debugging pseudocode
public async debugContainer(containerId: string): Promise<void> {
  // Get container info
  const containerInfo = await this.containerUtils.getContainerInfo(containerId);
  console.log('Container Info:', containerInfo);
  
  // Get container logs
  const logs = await this.containerUtils.getContainerLogs(containerId, { lines: 100 });
  console.log('Container Logs:', logs);
  
  // Execute diagnostic commands
  const processes = await this.containerUtils.executeCommand(containerId, 'ps aux');
  console.log('Container Processes:', processes.stdout);
  
  const networkInfo = await this.containerUtils.executeCommand(containerId, 'ip addr');
  console.log('Container Network:', networkInfo.stdout);
}
```

## Conclusion

The Docker Provider implementation provides a robust and secure way to manage VSCode instances as Docker containers. It leverages Docker's container technology to provide isolated, resource-constrained environments for remote development.

Key features of the implementation include:
1. **Container Lifecycle Management**: Complete management of container lifecycle
2. **Volume Management**: Persistent storage for workspaces
3. **Network Configuration**: Secure network access to instances
4. **Resource Management**: Efficient allocation and monitoring of resources
5. **State Persistence**: Reliable state tracking and recovery
6. **Security Measures**: Comprehensive security measures for container isolation

The implementation is designed to be:
1. **Robust**: Handles errors and edge cases gracefully
2. **Scalable**: Supports multiple instances with efficient resource usage
3. **Secure**: Implements security best practices for container isolation
4. **Maintainable**: Well-structured code with clear separation of concerns
5. **Extensible**: Designed for easy extension with new features