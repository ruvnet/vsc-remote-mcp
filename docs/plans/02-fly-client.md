# Fly.io Client Integration for VSCode Remote Swarm

## 1. Introduction

This document outlines the design and implementation of the Fly.io client integration for the VSCode Remote Swarm system. The client provides a TypeScript wrapper around the `fly-admin` package, enabling seamless deployment and management of VSCode instances on Fly.io infrastructure.

### 1.1 Goals

- Create a robust client wrapper around the `fly-admin` package
- Implement comprehensive error handling and retry mechanisms
- Design clear TypeScript interfaces for all client operations
- Ensure seamless integration with the Provider Abstraction Layer
- Support all required operations for VSCode instance management

### 1.2 Key Components

- **FlyClient**: Core client wrapper around `fly-admin`
- **FlyAuth**: Authentication and token management
- **FlyError**: Error handling and recovery strategies
- **FlyTypes**: TypeScript interfaces for Fly.io operations

## 2. Client Architecture

The Fly.io client follows a modular architecture with clear separation of concerns:

```
FlyClient
├── Authentication (FlyAuth)
├── Error Handling (FlyError)
├── Resource Management
│   ├── App Management
│   ├── Machine Management
│   ├── Network Management
│   └── Volume Management
└── Utilities
    ├── Retry Logic
    ├── Logging
    └── Configuration
```

### 2.1 Client Initialization

The client is initialized with an API token and optional configuration parameters:

```typescript
import { FlyClient } from './providers/fly/client';

// Initialize with token only
const client = new FlyClient('FLY_API_TOKEN');

// Initialize with token and configuration
const client = new FlyClient('FLY_API_TOKEN', {
  organization: 'my-org',
  defaultRegion: 'ams',
  retryOptions: {
    maxRetries: 3,
    initialDelayMs: 1000
  },
  logger: customLogger
});
```

## 3. Core Client Implementation

### 3.1 FlyClient Class

The `FlyClient` class serves as the main entry point for all Fly.io operations:

```typescript
export class FlyClient {
  private flyAdmin: FlyAdmin;
  private auth: FlyAuth;
  private config: FlyClientConfig;
  private logger: Logger;

  constructor(apiToken: string, config?: Partial<FlyClientConfig>) {
    this.config = this.mergeWithDefaultConfig(config);
    this.logger = this.config.logger || createDefaultLogger();
    this.auth = new FlyAuth(apiToken, this.config);
    this.flyAdmin = this.auth.createClient();
  }

  // App management methods
  async createApp(options: CreateAppOptions): Promise<App> { ... }
  async getApp(appName: string): Promise<App | null> { ... }
  async listApps(): Promise<App[]> { ... }
  async deleteApp(appName: string): Promise<void> { ... }

  // Machine management methods
  async createMachine(options: CreateMachineOptions): Promise<Machine> { ... }
  async getMachine(appName: string, machineId: string): Promise<Machine | null> { ... }
  async listMachines(appName: string): Promise<Machine[]> { ... }
  async startMachine(appName: string, machineId: string): Promise<void> { ... }
  async stopMachine(appName: string, machineId: string): Promise<void> { ... }
  async restartMachine(appName: string, machineId: string): Promise<void> { ... }
  async deleteMachine(appName: string, machineId: string): Promise<void> { ... }

  // Network management methods
  async allocateIpAddress(options: AllocateIpOptions): Promise<IpAddress> { ... }
  async releaseIpAddress(appName: string, ipId: string): Promise<void> { ... }
  async listIpAddresses(appName: string): Promise<IpAddress[]> { ... }

  // Volume management methods
  async createVolume(options: CreateVolumeOptions): Promise<Volume> { ... }
  async getVolume(appName: string, volumeId: string): Promise<Volume | null> { ... }
  async listVolumes(appName: string): Promise<Volume[]> { ... }
  async extendVolume(appName: string, volumeId: string, sizeGb: number): Promise<Volume> { ... }
  async deleteVolume(appName: string, volumeId: string): Promise<void> { ... }

  // Utility methods
  private mergeWithDefaultConfig(config?: Partial<FlyClientConfig>): FlyClientConfig { ... }
}
```

### 3.2 Authentication (FlyAuth)

The `FlyAuth` class handles authentication and token management:

```typescript
export class FlyAuth {
  private apiToken: string;
  private config: FlyClientConfig;

  constructor(apiToken: string, config: FlyClientConfig) {
    this.apiToken = apiToken;
    this.config = config;
  }

  createClient(): FlyAdmin {
    return createClient(this.apiToken);
  }

  validateToken(): Promise<boolean> {
    // Validate token by making a simple API call
    return this.createClient().App.listApps()
      .then(() => true)
      .catch(() => false);
  }
}
```

## 4. TypeScript Interfaces

### 4.1 Configuration Interfaces

```typescript
export interface FlyClientConfig {
  organization?: string;
  defaultRegion: string;
  regions: string[];
  retryOptions: RetryOptions;
  logger?: Logger;
}

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}
```

### 4.2 App Management Interfaces

```typescript
export interface App {
  id: string;
  name: string;
  organization: string;
  status: AppStatus;
  createdAt: string;
  updatedAt: string;
}

export enum AppStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface CreateAppOptions {
  name: string;
  organization?: string;
  region?: string;
}
```

### 4.3 Machine Management Interfaces

```typescript
export interface Machine {
  id: string;
  name?: string;
  state: MachineState;
  region: string;
  instanceId: string;
  createdAt: string;
  updatedAt: string;
  config: MachineConfig;
  events?: MachineEvent[];
}

export enum MachineState {
  CREATED = 'created',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
  CRASHED = 'crashed',
  FAILED = 'failed'
}

export interface MachineConfig {
  image: string;
  guest?: {
    cpus: number;
    memory_mb: number;
    cpu_kind?: 'shared' | 'performance';
  };
  env?: Record<string, string>;
  services?: ServiceConfig[];
  mounts?: MountConfig[];
  metadata?: Record<string, string>;
}

export interface ServiceConfig {
  ports: PortConfig[];
  protocol: 'tcp' | 'udp';
  internal_port: number;
}

export interface PortConfig {
  port: number;
  handlers: string[];
}

export interface MountConfig {
  volume: string;
  path: string;
}

export interface CreateMachineOptions {
  app_name: string;
  region?: string;
  name?: string;
  config: MachineConfig;
}

export interface MachineEvent {
  id: string;
  type: string;
  timestamp: string;
  data?: any;
}
```

### 4.4 Network Management Interfaces

```typescript
export interface IpAddress {
  id: string;
  address: string;
  type: 'v4' | 'v6';
  created_at: string;
}

export interface AllocateIpOptions {
  app_name: string;
  type: 'v4' | 'v6';
  region?: string;
}
```

### 4.5 Volume Management Interfaces

```typescript
export interface Volume {
  id: string;
  name: string;
  size_gb: number;
  region: string;
  state: VolumeState;
  attached_machine_id?: string;
  created_at: string;
  updated_at: string;
}

export enum VolumeState {
  CREATED = 'created',
  ATTACHING = 'attaching',
  ATTACHED = 'attached',
  DETACHING = 'detaching',
  DETACHED = 'detached',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed'
}

export interface CreateVolumeOptions {
  app_name: string;
  name: string;
  size_gb: number;
  region?: string;
  snapshot_id?: string;
}
```

### 4.6 Error Interfaces

```typescript
export enum FlyErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  RESOURCE = 'RESOURCE',
  NETWORK = 'NETWORK',
  API = 'API',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL = 'INTERNAL'
}

export interface FlyErrorOptions {
  message: string;
  code: string;
  category: FlyErrorCategory;
  retryable: boolean;
  cause?: Error;
  context?: Record<string, any>;
}

export class FlyError extends Error {
  code: string;
  category: FlyErrorCategory;
  retryable: boolean;
  cause?: Error;
  context?: Record<string, any>;

  constructor(options: FlyErrorOptions) {
    super(options.message);
    this.name = 'FlyError';
    this.code = options.code;
    this.category = options.category;
    this.retryable = options.retryable;
    this.cause = options.cause;
    this.context = options.context;
  }
}
```

## 5. Error Handling and Retry Logic

### 5.1 Error Categories and Codes

The client defines specific error categories and codes for Fly.io operations:

```typescript
export enum FlyErrorCode {
  // Authentication errors
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Network errors
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // API errors
  API_INVALID_REQUEST = 'API_INVALID_REQUEST',
  API_UNSUPPORTED_OPERATION = 'API_UNSUPPORTED_OPERATION',
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Internal errors
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

### 5.2 Error Mapping

The client maps Fly.io API errors to standardized error codes:

```typescript
function mapApiErrorToFlyError(apiError: any): FlyError {
  // Check for authentication errors
  if (apiError.status === 401) {
    return new FlyError({
      message: 'Invalid or expired API token',
      code: FlyErrorCode.AUTH_INVALID_TOKEN,
      category: FlyErrorCategory.AUTHENTICATION,
      retryable: false,
      cause: apiError
    });
  }
  
  // Check for resource not found
  if (apiError.status === 404) {
    return new FlyError({
      message: 'Resource not found',
      code: FlyErrorCode.RESOURCE_NOT_FOUND,
      category: FlyErrorCategory.RESOURCE,
      retryable: false,
      cause: apiError
    });
  }
  
  // Check for rate limiting
  if (apiError.status === 429) {
    return new FlyError({
      message: 'Rate limit exceeded',
      code: FlyErrorCode.RATE_LIMIT_EXCEEDED,
      category: FlyErrorCategory.RATE_LIMIT,
      retryable: true,
      cause: apiError
    });
  }
  
  // Default to internal error
  return new FlyError({
    message: apiError.message || 'Unknown Fly.io API error',
    code: FlyErrorCode.INTERNAL_ERROR,
    category: FlyErrorCategory.INTERNAL,
    retryable: true,
    cause: apiError
  });
}
```

### 5.3 Retry Logic

The client implements exponential backoff retry logic for retryable errors:

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries <= options.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (error instanceof FlyError && !error.retryable) {
        throw error;
      }
      
      if (retries >= options.maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.initialDelayMs * Math.pow(options.backoffFactor, retries),
        options.maxDelayMs
      );
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      retries++;
    }
  }
  
  throw lastError;
}
```

## 6. Integration with Provider Abstraction Layer

The Fly.io client is designed to integrate seamlessly with the Provider Abstraction Layer (PAL) through the `FlyIOProvider` class:

```typescript
export class FlyIOProvider implements Provider {
  private flyClient: FlyClient;
  
  constructor(config: FlyIOProviderConfig) {
    this.flyClient = new FlyClient(config.apiToken, {
      organization: config.organization,
      defaultRegion: config.defaultRegion,
      regions: config.regions
    });
  }
  
  async createInstance(config: InstanceConfig): Promise<Instance> {
    // Map generic config to Fly.io-specific options
    const appName = config.name || `vscode-${generateId()}`;
    
    // Create app if it doesn't exist
    let app: App;
    try {
      app = await this.flyClient.getApp(appName);
      if (!app) {
        app = await this.flyClient.createApp({
          name: appName,
          organization: this.config.organization,
          region: config.resources.region || this.config.defaultRegion
        });
      }
    } catch (error) {
      throw this.mapToProviderError(error);
    }
    
    // Create machine
    try {
      const machine = await this.flyClient.createMachine({
        app_name: appName,
        region: config.resources.region || this.config.defaultRegion,
        config: {
          image: config.image,
          guest: {
            cpus: config.resources.cpu.cores,
            memory_mb: config.resources.memory.min,
            cpu_kind: config.resources.cpu.cores > 1 ? 'performance' : 'shared'
          },
          env: config.env,
          services: this.mapNetworkConfigToServices(config.network)
        }
      });
      
      // Map machine to generic instance
      return this.mapMachineToInstance(machine, app);
    } catch (error) {
      throw this.mapToProviderError(error);
    }
  }
  
  // Implement other Provider interface methods
  // ...
  
  private mapMachineToInstance(machine: Machine, app: App): Instance {
    // Map Fly.io machine to generic instance
    return {
      id: machine.id,
      provider: ProviderType.FLYIO,
      status: this.mapMachineStateToInstanceStatus(machine.state),
      createdAt: new Date(machine.createdAt),
      lastActive: new Date(machine.updatedAt),
      config: {
        // Map machine config to instance config
      },
      resources: {
        // Map machine resources
      },
      network: {
        // Map machine network
      },
      metadata: {
        appName: app.name,
        region: machine.region,
        // Other metadata
      }
    };
  }
  
  private mapToProviderError(error: any): Error {
    // Map Fly.io errors to Provider errors
    if (error instanceof FlyError) {
      // Map FlyError to appropriate Provider error
    }
    return error;
  }
}
```

## 7. Implementation Considerations

### 7.1 Authentication

The client uses API token-based authentication with Fly.io. The token is provided during client initialization and used for all API calls. The client should validate the token during initialization to ensure it has the necessary permissions.

### 7.2 Error Handling

The client implements comprehensive error handling with:

1. **Standardized Error Types**: All errors are wrapped in the `FlyError` class with consistent properties.
2. **Error Categorization**: Errors are categorized for easier handling and reporting.
3. **Retryable Errors**: Errors are marked as retryable or non-retryable to guide retry logic.
4. **Detailed Error Context**: Errors include context information for debugging.

### 7.3 Logging

The client supports customizable logging through a logger interface:

```typescript
export interface Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
}
```

### 7.4 Resource Cleanup

The client ensures proper resource cleanup to prevent orphaned resources:

1. **Atomic Operations**: Operations that create multiple resources are designed to be atomic.
2. **Cleanup on Failure**: If an operation fails partway through, the client attempts to clean up any created resources.
3. **Deletion Order**: Resources are deleted in the correct order to prevent dependency issues.

## 8. Usage Examples

### 8.1 Creating a VSCode Instance

```typescript
// Initialize client
const flyClient = new FlyClient('FLY_API_TOKEN', {
  organization: 'my-org',
  defaultRegion: 'ams'
});

// Create app
const app = await flyClient.createApp({
  name: 'vscode-instance-1'
});

// Create volume for persistent storage
const volume = await flyClient.createVolume({
  app_name: app.name,
  name: 'vscode-data',
  size_gb: 10
});

// Create machine with VSCode
const machine = await flyClient.createMachine({
  app_name: app.name,
  config: {
    image: 'codercom/code-server:latest',
    guest: {
      cpus: 2,
      memory_mb: 4096
    },
    env: {
      PASSWORD: 'my-secure-password'
    },
    services: [
      {
        ports: [
          {
            port: 8080,
            handlers: ['http']
          }
        ],
        protocol: 'tcp',
        internal_port: 8080
      }
    ],
    mounts: [
      {
        volume: volume.name,
        path: '/home/coder/project'
      }
    ]
  }
});

// Allocate IP address
const ip = await flyClient.allocateIpAddress({
  app_name: app.name,
  type: 'v4'
});

console.log(`VSCode instance running at http://${ip.address}:8080`);
```

### 8.2 Managing a VSCode Instance

```typescript
// Stop a machine
await flyClient.stopMachine('vscode-instance-1', 'machine-id');

// Start a machine
await flyClient.startMachine('vscode-instance-1', 'machine-id');

// Restart a machine
await flyClient.restartMachine('vscode-instance-1', 'machine-id');

// Delete a machine
await flyClient.deleteMachine('vscode-instance-1', 'machine-id');

// Delete an app (and all associated resources)
await flyClient.deleteApp('vscode-instance-1');
```

## 9. Conclusion

The Fly.io client integration provides a robust foundation for deploying and managing VSCode instances on Fly.io infrastructure. The client abstracts the complexities of the Fly.io API while providing comprehensive error handling, retry logic, and type safety through TypeScript interfaces.

Key benefits of this implementation include:

- **Type Safety**: Comprehensive TypeScript interfaces for all operations
- **Error Handling**: Standardized error handling with categorization and retry logic
- **Seamless Integration**: Easy integration with the Provider Abstraction Layer
- **Resource Management**: Complete lifecycle management for all Fly.io resources
- **Extensibility**: Modular design that can be extended for additional functionality

This implementation serves as a solid foundation for the VSCode Remote Swarm system's Fly.io integration, enabling reliable and scalable deployment of VSCode instances across Fly.io's global infrastructure.