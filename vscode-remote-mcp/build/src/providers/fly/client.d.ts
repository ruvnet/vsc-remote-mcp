/**
 * Fly.io Client for VSCode Remote Swarm
 *
 * This module provides a TypeScript client for interacting with the Fly.io API
 * through the fly-admin package. It handles machine creation/deletion, app management,
 * IP address allocation, and volume management.
 *
 * @module fly-client
 */
/**
 * Configuration options for the Fly.io client
 */
export interface FlyClientConfig {
    /** Organization ID or slug */
    organization?: string;
    /** Default region for resource creation */
    defaultRegion: string;
    /** Available regions for resource creation */
    regions: string[];
    /** Retry options for API calls */
    retryOptions: RetryOptions;
    /** Optional logger instance */
    logger?: Logger;
}
/**
 * Retry options for API calls
 */
export interface RetryOptions {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Initial delay in milliseconds */
    initialDelayMs: number;
    /** Maximum delay in milliseconds */
    maxDelayMs: number;
    /** Backoff factor for exponential backoff */
    backoffFactor: number;
}
/**
 * Logger interface for client logging
 */
export interface Logger {
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
}
/**
 * Error categories for Fly.io client
 */
export declare enum FlyErrorCategory {
    AUTHENTICATION = "AUTHENTICATION",
    RESOURCE = "RESOURCE",
    NETWORK = "NETWORK",
    API = "API",
    RATE_LIMIT = "RATE_LIMIT",
    INTERNAL = "INTERNAL"
}
/**
 * Error codes for Fly.io client
 */
export declare enum FlyErrorCode {
    AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN",
    AUTH_EXPIRED_TOKEN = "AUTH_EXPIRED_TOKEN",
    AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_INSUFFICIENT_PERMISSIONS",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
    RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED",
    NETWORK_CONNECTION_FAILED = "NETWORK_CONNECTION_FAILED",
    NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
    API_INVALID_REQUEST = "API_INVALID_REQUEST",
    API_UNSUPPORTED_OPERATION = "API_UNSUPPORTED_OPERATION",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
/**
 * Options for creating a FlyError
 */
export interface FlyErrorOptions {
    message: string;
    code: FlyErrorCode;
    category: FlyErrorCategory;
    retryable: boolean;
    cause?: Error;
    context?: Record<string, any>;
}
/**
 * Custom error class for Fly.io client errors
 */
export declare class FlyError extends Error {
    code: FlyErrorCode;
    category: FlyErrorCategory;
    retryable: boolean;
    cause?: Error;
    context?: Record<string, any>;
    constructor(options: FlyErrorOptions);
}
/**
 * App representation in Fly.io
 */
export interface App {
    id: string;
    name: string;
    organization: string;
    status: AppStatus;
    createdAt: string;
    updatedAt: string;
}
/**
 * App status enum
 */
export declare enum AppStatus {
    PENDING = "pending",
    RUNNING = "running",
    STOPPED = "stopped",
    ERROR = "error"
}
/**
 * Options for creating an app
 */
export interface CreateAppOptions {
    name: string;
    organization?: string;
    region?: string;
}
/**
 * Machine representation in Fly.io
 */
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
/**
 * Machine state enum
 */
export declare enum MachineState {
    CREATED = "created",
    STARTING = "starting",
    STARTED = "started",
    STOPPING = "stopping",
    STOPPED = "stopped",
    DESTROYING = "destroying",
    DESTROYED = "destroyed",
    CRASHED = "crashed",
    FAILED = "failed"
}
/**
 * Machine configuration
 */
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
/**
 * Service configuration for machine
 */
export interface ServiceConfig {
    ports: PortConfig[];
    protocol: 'tcp' | 'udp';
    internal_port: number;
}
/**
 * Port configuration for service
 */
export interface PortConfig {
    port: number;
    handlers: string[];
}
/**
 * Mount configuration for machine
 */
export interface MountConfig {
    volume: string;
    path: string;
}
/**
 * Options for creating a machine
 */
export interface CreateMachineOptions {
    app_name: string;
    region?: string;
    name?: string;
    config: MachineConfig;
}
/**
 * Machine event
 */
export interface MachineEvent {
    id: string;
    type: string;
    timestamp: string;
    data?: any;
}
/**
 * IP address representation in Fly.io
 */
export interface IpAddress {
    id: string;
    address: string;
    type: 'v4' | 'v6';
    created_at: string;
}
/**
 * Options for allocating an IP address
 */
export interface AllocateIpOptions {
    app_name: string;
    type: 'v4' | 'v6';
    region?: string;
}
/**
 * Volume representation in Fly.io
 */
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
/**
 * Volume state enum
 */
export declare enum VolumeState {
    CREATED = "created",
    ATTACHING = "attaching",
    ATTACHED = "attached",
    DETACHING = "detaching",
    DETACHED = "detached",
    DESTROYING = "destroying",
    DESTROYED = "destroyed"
}
/**
 * Options for creating a volume
 */
export interface CreateVolumeOptions {
    app_name: string;
    name: string;
    size_gb: number;
    region?: string;
    snapshot_id?: string;
}
/**
 * Fly.io client for interacting with the Fly.io API
 */
export declare class FlyClient {
    private apiToken;
    private flyAdmin;
    private config;
    private logger;
    /**
     * Create a new Fly.io client
     * @param apiToken Fly.io API token
     * @param config Client configuration
     */
    constructor(apiToken: string, config?: Partial<FlyClientConfig>);
    /**
     * Merge provided configuration with default configuration
     * @param config Partial configuration
     * @returns Complete configuration
     */
    private mergeWithDefaultConfig;
    /**
     * Execute an operation with retry logic
     * @param operation Operation to execute
     * @returns Operation result
     */
    private executeWithRetry;
    /**
     * Validate the API token
     * @returns True if token is valid
     */
    validateToken(): Promise<boolean>;
    /**
     * Create a new app
     * @param options App creation options
     * @returns Created app
     */
    createApp(options: CreateAppOptions): Promise<App>;
    /**
     * Get app details
     * @param appName App name
     * @returns App details or null if not found
     */
    getApp(appName: string): Promise<App | null>;
    /**
     * List all apps
     * @returns List of apps
     */
    listApps(): Promise<App[]>;
    /**
     * Delete an app
     * @param appName App name
     */
    deleteApp(appName: string): Promise<void>;
    /**
     * Create a new machine
     * @param options Machine creation options
     * @returns Created machine
     */
    createMachine(options: CreateMachineOptions): Promise<Machine>;
    /**
     * Get machine details
     * @param appName App name
     * @param machineId Machine ID
     * @returns Machine details or null if not found
     */
    getMachine(appName: string, machineId: string): Promise<Machine | null>;
    /**
     * List all machines for an app
     * @param appName App name
     * @returns List of machines
     */
    listMachines(appName: string): Promise<Machine[]>;
    /**
     * Start a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    startMachine(appName: string, machineId: string): Promise<void>;
    /**
     * Stop a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    stopMachine(appName: string, machineId: string): Promise<void>;
    /**
     * Restart a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    restartMachine(appName: string, machineId: string): Promise<void>;
    /**
     * Delete a machine
     * @param appName App name
     * @param machineId Machine ID
     */
    deleteMachine(appName: string, machineId: string): Promise<void>;
    /**
     * Allocate an IP address
     * @param options IP allocation options
     * @returns Allocated IP address
     */
    allocateIpAddress(options: AllocateIpOptions): Promise<IpAddress>;
    /**
     * Release an IP address
     * @param appName App name
     * @param ipId IP address ID
     */
    releaseIpAddress(appName: string, ipId: string): Promise<void>;
    /**
     * List IP addresses for an app
     * @param appName App name
     * @returns List of IP addresses
     */
    listIpAddresses(appName: string): Promise<IpAddress[]>;
    /**
     * Create a volume
     * @param options Volume creation options
     * @returns Created volume
     */
    createVolume(options: CreateVolumeOptions): Promise<Volume>;
    /**
     * Get volume details
     * @param appName App name
     * @param volumeId Volume ID
     * @returns Volume details or null if not found
     */
    getVolume(appName: string, volumeId: string): Promise<Volume | null>;
    /**
     * List volumes for an app
     * @param appName App name
     * @returns List of volumes
     */
    listVolumes(appName: string): Promise<Volume[]>;
    /**
     * Extend a volume
     * @param appName App name
     * @param volumeId Volume ID
     * @param sizeGb New size in GB
     * @returns Updated volume
     */
    extendVolume(appName: string, volumeId: string, sizeGb: number): Promise<Volume>;
    /**
     * Delete a volume
     * @param appName App name
     * @param volumeId Volume ID
     */
    deleteVolume(appName: string, volumeId: string): Promise<void>;
    /**
     * Create a VSCode instance
     * @param options VSCode instance options
     * @returns Created instance details
     */
    createVSCodeInstance(options: {
        name?: string;
        region?: string;
        cpus?: number;
        memoryMb?: number;
        volumeSizeGb?: number;
        env?: Record<string, string>;
    }): Promise<{
        app: App;
        machine: Machine;
        volume: Volume;
        ipAddress: IpAddress;
        url: string;
    }>;
}
