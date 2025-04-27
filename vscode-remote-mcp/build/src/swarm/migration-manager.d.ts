/**
 * Migration Manager for VSCode Remote Swarm
 * Handles migration of VSCode instances between providers
 */
import { VSCodeInstance } from '../providers/core/instance.interface';
import { Provider } from '../providers/core/provider.interface';
import { ProviderType } from '../providers/core/provider-types';
import { InstanceRegistry } from './instance-registry';
import { SwarmConfig, MigrationStrategy } from './config';
/**
 * Migration step status
 */
export declare enum MigrationStepStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    SKIPPED = "skipped"
}
/**
 * Migration status
 */
export declare enum MigrationStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    TIMED_OUT = "timed_out"
}
/**
 * Migration step
 */
export interface MigrationStep {
    name: string;
    description: string;
    status: MigrationStepStatus;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}
/**
 * Migration plan
 */
export interface MigrationPlan {
    id: string;
    sourceInstanceId: string;
    sourceProviderType: ProviderType;
    targetProviderType: ProviderType;
    strategy: MigrationStrategy;
    keepSource: boolean;
    startTarget: boolean;
    timeoutSeconds: number;
    createdAt: Date;
    expiresAt: Date;
    steps: MigrationStep[];
    currentStepIndex: number;
    status: MigrationStatus;
    targetInstanceId?: string;
    error?: string;
    completedAt?: Date;
}
/**
 * Migration options
 */
export interface MigrationOptions {
    strategy?: MigrationStrategy;
    keepSource?: boolean;
    startTarget?: boolean;
    timeoutSeconds?: number;
}
/**
 * Migration result
 */
export interface MigrationResult {
    plan: MigrationPlan;
    success: boolean;
    targetInstance?: VSCodeInstance;
    error?: string;
}
/**
 * Migration manager class
 */
export declare class MigrationManager {
    private registry;
    private providers;
    private config;
    private migrationPlans;
    private storageDir;
    private migrationTimeouts;
    /**
     * Constructor
     */
    constructor(registry: InstanceRegistry, providers: Map<ProviderType, Provider>, config: SwarmConfig);
    /**
     * Initialize the migration manager
     */
    initialize(): Promise<void>;
    /**
     * Load migration plans from storage
     */
    private loadMigrationPlans;
    /**
     * Save migration plan to storage
     */
    private saveMigrationPlan;
    /**
     * Resume in-progress migrations
     */
    private resumeMigrations;
    /**
     * Create a migration plan
     */
    createMigrationPlan(sourceInstanceId: string, targetProviderType: ProviderType, options?: MigrationOptions): Promise<MigrationPlan>;
    /**
     * Create migration steps based on source and target provider types
     */
    private createMigrationSteps;
    /**
     * Start a migration
     */
    startMigration(migrationId: string): Promise<MigrationResult>;
    /**
     * Execute a migration
     */
    private executeMigration;
    /**
     * Execute a migration step
     */
    private executeStep;
    /**
     * Handle migration timeout
     */
    private handleMigrationTimeout;
    /**
     * Clear migration timeout
     */
    private clearMigrationTimeout;
    /**
     * Cancel a migration
     */
    cancelMigration(migrationId: string): Promise<boolean>;
    /**
     * Get a migration plan
     */
    getMigrationPlan(migrationId: string): MigrationPlan | null;
    /**
     * List migration plans
     */
    listMigrationPlans(status?: MigrationStatus): MigrationPlan[];
    /**
     * Dispose of migration manager resources
     */
    dispose(): void;
}
