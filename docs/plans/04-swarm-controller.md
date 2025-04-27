# VSCode Remote Swarm Controller

## Overview

The VSCode Remote Swarm Controller is a central component of the VSCode Remote system that manages VSCode instances across multiple providers. It provides a unified interface for creating, managing, and monitoring VSCode instances, regardless of the underlying infrastructure provider.

The Swarm Controller is designed to be:

- **Provider-agnostic**: Works with any provider that implements the Provider interface
- **Scalable**: Can manage thousands of VSCode instances across multiple providers
- **Resilient**: Monitors instance health and can recover from failures
- **Flexible**: Supports migration of instances between providers

## Architecture

The Swarm Controller consists of several key components:

1. **Swarm Controller**: The main controller class that coordinates all operations
2. **Instance Registry**: Tracks and manages VSCode instances
3. **Health Monitor**: Monitors instance health and provides recovery mechanisms
4. **Migration Manager**: Handles migration of instances between providers
5. **Configuration**: Defines swarm behavior and settings

### Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      Swarm Controller                           │
│                                                                 │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────┐  │
│  │ Instance      │   │ Health        │   │ Migration         │  │
│  │ Registry      │   │ Monitor       │   │ Manager           │  │
│  └───────┬───────┘   └───────┬───────┘   └─────────┬─────────┘  │
│          │                   │                     │            │
└──────────┼───────────────────┼─────────────────────┼────────────┘
           │                   │                     │
           ▼                   ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Provider Abstraction Layer                      │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ Docker         │  │ Fly.io         │  │ Other              │  │
│  │ Provider       │  │ Provider       │  │ Providers          │  │
│  └────────────────┘  └────────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Swarm Controller

The Swarm Controller is the main entry point for managing VSCode instances. It provides a high-level API for creating, managing, and monitoring instances, as well as coordinating operations between the various components.

### Responsibilities

- Initialize and coordinate all components (Instance Registry, Health Monitor, Migration Manager)
- Provide a unified API for instance management
- Route operations to the appropriate provider
- Handle provider initialization and configuration
- Manage provider capabilities and constraints
- Provide swarm status information

### Key Methods

- `initialize()`: Initialize the swarm controller and all components
- `createInstance(config, providerType)`: Create a new VSCode instance
- `getInstance(instanceId)`: Get an instance by ID
- `listInstances(filter)`: List instances with optional filtering
- `startInstance(instanceId)`: Start an instance
- `stopInstance(instanceId)`: Stop an instance
- `deleteInstance(instanceId)`: Delete an instance
- `updateInstance(instanceId, config)`: Update instance configuration
- `checkInstanceHealth(instanceId)`: Check instance health
- `recoverInstance(instanceId)`: Recover an unhealthy instance
- `createMigrationPlan(sourceInstanceId, targetProviderType)`: Create a migration plan
- `startMigration(migrationId)`: Start a migration
- `getSwarmStatus()`: Get overall swarm status

## Instance Registry

The Instance Registry is responsible for tracking and managing VSCode instances across all providers. It maintains a registry of all instances and their current state, and provides methods for querying and updating this information.

### Responsibilities

- Track all VSCode instances across all providers
- Maintain instance metadata and state
- Provide methods for querying instances
- Persist instance information to disk
- Handle instance registration and deregistration

### Key Methods

- `registerInstance(instance)`: Register a new instance
- `updateInstance(instance)`: Update an existing instance
- `removeInstance(instanceId)`: Remove an instance
- `getInstance(instanceId)`: Get an instance by ID
- `listInstances(providerType, status)`: List instances with optional filtering
- `getInstanceCount(providerType)`: Get instance count by provider
- `findInstancesByName(namePattern)`: Find instances by name pattern
- `findInstancesByMetadata(key, value)`: Find instances by metadata

### Instance Storage

The Instance Registry persists instance information to disk to ensure it can recover from restarts. Each instance is stored as a JSON file in a configurable directory, with the instance ID as the filename.

```
/path/to/state/instances/
  ├── instance-1.json
  ├── instance-2.json
  └── instance-3.json
```

## Health Monitor

The Health Monitor is responsible for monitoring the health of VSCode instances and providing recovery mechanisms for unhealthy instances. It periodically checks the health of all running instances and can automatically recover instances that are deemed unhealthy.

### Responsibilities

- Periodically check instance health
- Maintain health history for each instance
- Provide recovery mechanisms for unhealthy instances
- Notify the Swarm Controller of health status changes
- Persist health information to disk

### Health Checks

The Health Monitor performs the following checks on each instance:

1. **Provider Check**: Verify the instance exists in the provider
2. **Status Check**: Verify the instance is in the expected status
3. **Connectivity Check**: Verify the instance is responsive
4. **Resource Check**: Verify the instance has sufficient resources

### Health Status

Each instance can have one of the following health statuses:

- **Healthy**: The instance is functioning normally
- **Unhealthy**: The instance is not functioning correctly
- **Degraded**: The instance is functioning but with reduced performance
- **Recovering**: The instance is in the process of being recovered
- **Unknown**: The health status could not be determined

### Recovery Mechanisms

The Health Monitor can automatically recover unhealthy instances using the following mechanisms:

1. **Restart**: Restart the instance
2. **Recreate**: Delete and recreate the instance
3. **Migrate**: Migrate the instance to a different provider

The recovery mechanism used depends on the configuration and the nature of the health issue.

## Migration Manager

The Migration Manager is responsible for handling the migration of VSCode instances between providers. It provides mechanisms for planning, executing, and monitoring migrations.

### Responsibilities

- Create migration plans
- Execute migrations
- Monitor migration progress
- Handle migration failures
- Persist migration information to disk

### Migration Strategies

The Migration Manager supports the following migration strategies:

1. **Stop and Recreate**: Stop the source instance, then create the target instance
2. **Create Then Stop**: Create the target instance, then stop the source instance

The strategy used depends on the configuration and the specific requirements of the migration.

### Migration Steps

A typical migration involves the following steps:

1. **Prepare**: Prepare for migration
2. **Validate Source**: Validate the source instance
3. **Validate Target Provider**: Validate the target provider
4. **Export Source Config**: Export the source instance configuration
5. **Create Target**: Create the target instance
6. **Start Target**: Start the target instance
7. **Verify Target**: Verify the target instance
8. **Stop Source**: Stop the source instance
9. **Clean Up Source**: Clean up the source instance
10. **Complete**: Complete the migration

### Migration Status

A migration can have one of the following statuses:

- **Pending**: The migration is pending
- **In Progress**: The migration is in progress
- **Completed**: The migration has completed successfully
- **Failed**: The migration has failed
- **Cancelled**: The migration was cancelled
- **Timed Out**: The migration timed out

## Configuration

The Swarm Controller configuration defines the behavior and settings for the swarm. It includes settings for the general operation, providers, health monitoring, and migration.

### General Configuration

- **State Directory**: Directory for storing state information
- **Default Provider Type**: Default provider type for new instances
- **Load State on Startup**: Whether to load state from disk on startup
- **Auto-Save Interval**: Interval for auto-saving state to disk

### Provider Configuration

- **Enabled Providers**: List of enabled providers
- **Provider-Specific Configuration**: Configuration specific to each provider

### Health Monitor Configuration

- **Enabled**: Whether health monitoring is enabled
- **Check Interval**: Interval for health checks
- **Auto-Recover**: Whether to automatically recover unhealthy instances
- **Max Recovery Attempts**: Maximum number of recovery attempts
- **History Size**: Number of health history entries to keep
- **Recovery Actions**: Enabled recovery actions (restart, recreate, migrate)

### Migration Configuration

- **Enabled**: Whether migration is enabled
- **Default Strategy**: Default migration strategy
- **Timeout**: Migration timeout

## Integration with Provider Abstraction Layer

The Swarm Controller integrates with the Provider Abstraction Layer to manage instances across different providers. It uses the Provider interface to interact with providers in a consistent way, regardless of the underlying implementation.

### Provider Interface

The Provider interface defines the contract that all provider implementations must fulfill. It includes methods for creating, managing, and monitoring instances.

```typescript
export interface Provider {
  readonly type: ProviderType;
  getCapabilities(): ProviderCapabilities;
  initialize(): Promise<void>;
  createInstance(config: InstanceConfig): Promise<VSCodeInstance>;
  getInstance(instanceId: string): Promise<VSCodeInstance | null>;
  listInstances(filter?: InstanceFilter): Promise<VSCodeInstance[]>;
  startInstance(instanceId: string): Promise<VSCodeInstance>;
  stopInstance(instanceId: string, force?: boolean): Promise<VSCodeInstance>;
  deleteInstance(instanceId: string): Promise<boolean>;
  updateInstance(instanceId: string, config: Partial<InstanceConfig>): Promise<VSCodeInstance>;
  getInstanceLogs(instanceId: string, options?: LogOptions): Promise<InstanceLogs>;
  executeCommand(instanceId: string, command: string): Promise<CommandResult>;
}
```

### Provider Capabilities

Each provider exposes its capabilities through the `getCapabilities()` method. The Swarm Controller uses this information to determine what operations are supported by each provider and to make decisions about instance placement and migration.

```typescript
export interface ProviderCapabilities {
  supportsLiveResize: boolean;
  supportsSnapshotting: boolean;
  supportsMultiRegion: boolean;
  supportedRegions?: string[];
  maxInstancesPerUser: number;
  maxResourcesPerInstance: {
    cpu: { cores: number; limit?: number; };
    memory: { min: number; max?: number; };
    storage?: { size: number; persistent: boolean; };
  };
}
```

### Provider Factory

The Provider Factory is responsible for creating provider instances based on the provider type and configuration. The Swarm Controller uses the Provider Factory to initialize providers during startup.

```typescript
export class ProviderFactory {
  static createProvider(type: ProviderType, config: ProviderConfig): Provider {
    // Create and return the appropriate provider instance
  }
}
```

## MCP Tool Integration

The Swarm Controller exposes its functionality through the MCP (Model Context Protocol) tools. These tools allow clients to interact with the Swarm Controller through a standardized interface.

### Swarm Management Tools

- **list_swarm_instances**: List all instances in the swarm
- **get_swarm_instance**: Get details for a specific instance
- **create_swarm_instance**: Create a new instance in the swarm
- **start_swarm_instance**: Start an instance in the swarm
- **stop_swarm_instance**: Stop an instance in the swarm
- **delete_swarm_instance**: Delete an instance from the swarm
- **update_swarm_instance**: Update an instance in the swarm
- **check_instance_health**: Check the health of an instance
- **recover_instance**: Recover an unhealthy instance
- **get_swarm_status**: Get overall swarm status

### Migration Tools

- **create_migration_plan**: Create a migration plan
- **start_migration**: Start a migration
- **cancel_migration**: Cancel a migration
- **get_migration_status**: Get migration status
- **list_migrations**: List all migrations

## Error Handling and Recovery

The Swarm Controller includes robust error handling and recovery mechanisms to ensure reliability and resilience.

### Error Handling

- **Provider Errors**: Errors from providers are caught and handled appropriately
- **Network Errors**: Network-related errors are retried with exponential backoff
- **Validation Errors**: Input validation errors are reported with clear error messages
- **State Errors**: State inconsistencies are detected and corrected when possible

### Recovery Mechanisms

- **Instance Recovery**: Unhealthy instances can be automatically recovered
- **Provider Failover**: If a provider becomes unavailable, instances can be migrated to another provider
- **State Recovery**: State information is persisted to disk and can be recovered after a restart
- **Graceful Degradation**: The system continues to function even if some components fail

## Security Considerations

The Swarm Controller includes several security features to protect the system and its users:

- **Authentication**: All operations require proper authentication
- **Authorization**: Access to instances is restricted to authorized users
- **Isolation**: Instances are isolated from each other
- **Secure Communication**: All communication is encrypted
- **Audit Logging**: All operations are logged for audit purposes

## Performance and Scalability

The Swarm Controller is designed to be highly scalable and performant:

- **Asynchronous Operations**: All operations are asynchronous to maximize throughput
- **Efficient State Management**: State is managed efficiently to minimize memory usage
- **Batched Operations**: Operations are batched when possible to reduce overhead
- **Caching**: Frequently accessed data is cached to improve performance
- **Horizontal Scaling**: The system can be scaled horizontally by adding more instances

## Conclusion

The VSCode Remote Swarm Controller provides a powerful and flexible system for managing VSCode instances across multiple providers. It enables users to create, manage, and monitor instances in a consistent way, regardless of the underlying infrastructure. With its robust health monitoring and migration capabilities, it ensures high availability and reliability for VSCode Remote users.