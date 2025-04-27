/**
 * Migration Manager for VSCode Remote Swarm
 * Handles migration of VSCode instances between providers
 */

import { VSCodeInstance, InstanceConfig } from '../providers/core/instance.interface';
import { Provider } from '../providers/core/provider.interface';
import { ProviderType, InstanceStatus } from '../providers/core/provider-types';
import { InstanceRegistry } from './instance-registry';
import { SwarmConfig, MigrationStrategy } from './config';
import * as logger from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Migration plan
 */
export interface MigrationPlan {
  /**
   * Migration ID
   */
  id: string;
  
  /**
   * Source instance ID
   */
  sourceInstanceId: string;
  
  /**
   * Source provider type
   */
  sourceProviderType: ProviderType;
  
  /**
   * Target provider type
   */
  targetProviderType: ProviderType;
  
  /**
   * Migration strategy
   */
  strategy: MigrationStrategy;
  
  /**
   * Whether to keep the source instance after migration
   */
  keepSource: boolean;
  
  /**
   * Whether to start the target instance after migration
   */
  startTarget: boolean;
  
  /**
   * Timeout in seconds
   */
  timeoutSeconds: number;
  
  /**
   * Creation timestamp
   */
  createdAt: Date;
  
  /**
   * Expiration timestamp
   */
  expiresAt: Date;
  
  /**
   * Migration steps
   */
  steps: MigrationStep[];
  
  /**
   * Current step index
   */
  currentStepIndex: number;
  
  /**
   * Migration status
   */
  status: MigrationStatus;
  
  /**
   * Target instance ID (if created)
   */
  targetInstanceId?: string;
  
  /**
   * Error message (if failed)
   */
  error?: string;
  
  /**
   * Completion timestamp (if completed)
   */
  completedAt?: Date;
}

/**
 * Migration step
 */
export interface MigrationStep {
  /**
   * Step name
   */
  name: string;
  
  /**
   * Step description
   */
  description: string;
  
  /**
   * Step status
   */
  status: MigrationStepStatus;
  
  /**
   * Start timestamp
   */
  startedAt?: Date;
  
  /**
   * Completion timestamp
   */
  completedAt?: Date;
  
  /**
   * Error message
   */
  error?: string;
}

/**
 * Migration step status
 */
export enum MigrationStepStatus {
  /**
   * Step is pending
   */
  PENDING = 'pending',
  
  /**
   * Step is in progress
   */
  IN_PROGRESS = 'in_progress',
  
  /**
   * Step completed successfully
   */
  COMPLETED = 'completed',
  
  /**
   * Step failed
   */
  FAILED = 'failed',
  
  /**
   * Step was skipped
   */
  SKIPPED = 'skipped'
}

/**
 * Migration status
 */
export enum MigrationStatus {
  /**
   * Migration is pending
   */
  PENDING = 'pending',
  
  /**
   * Migration is in progress
   */
  IN_PROGRESS = 'in_progress',
  
  /**
   * Migration completed successfully
   */
  COMPLETED = 'completed',
  
  /**
   * Migration failed
   */
  FAILED = 'failed',
  
  /**
   * Migration was cancelled
   */
  CANCELLED = 'cancelled',
  
  /**
   * Migration timed out
   */
  TIMED_OUT = 'timed_out'
}

/**
 * Migration options
 */
export interface MigrationOptions {
  /**
   * Migration strategy
   */
  strategy?: MigrationStrategy;
  
  /**
   * Whether to keep the source instance after migration
   */
  keepSource?: boolean;
  
  /**
   * Whether to start the target instance after migration
   */
  startTarget?: boolean;
  
  /**
   * Timeout in seconds
   */
  timeoutSeconds?: number;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /**
   * Migration plan
   */
  plan: MigrationPlan;
  
  /**
   * Whether migration was successful
   */
  success: boolean;
  
  /**
   * Target instance (if successful)
   */
  targetInstance?: VSCodeInstance;
  
  /**
   * Error message (if failed)
   */
  error?: string;
}

/**
 * Migration manager class
 */
export class MigrationManager {
  /**
   * Instance registry
   */
  private registry: InstanceRegistry;
  
  /**
   * Map of providers by type
   */
  private providers: Map<ProviderType, Provider>;
  
  /**
   * Swarm configuration
   */
  private config: SwarmConfig;
  
  /**
   * Map of migration plans by ID
   */
  private migrationPlans: Map<string, MigrationPlan> = new Map();
  
  /**
   * Storage directory for migration plans
   */
  private storageDir: string;
  
  /**
   * Map of migration timeouts by ID
   */
  private migrationTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Constructor
   * @param registry Instance registry
   * @param providers Map of providers by type
   * @param config Swarm configuration
   */
  constructor(
    registry: InstanceRegistry,
    providers: Map<ProviderType, Provider>,
    config: SwarmConfig
  ) {
    this.registry = registry;
    this.providers = providers;
    this.config = config;
    this.storageDir = path.join(config.general.stateDir, 'migrations');
    
    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }
  
  /**
   * Initialize the migration manager
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing migration manager');
    
    // Load migration plans
    this.loadMigrationPlans();
    
    // Resume in-progress migrations
    await this.resumeMigrations();
    
    logger.info('Migration manager initialized');
  }
  
  /**
   * Load migration plans from storage
   */
  private loadMigrationPlans(): void {
    try {
      logger.info(`Loading migration plans from ${this.storageDir}`);
      
      // Clear existing plans
      this.migrationPlans.clear();
      
      // Read plan files
      const files = fs.readdirSync(this.storageDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.storageDir, file);
            const data = fs.readFileSync(filePath, 'utf8');
            const plan = JSON.parse(data) as MigrationPlan;
            
            // Restore Date objects
            plan.createdAt = new Date(plan.createdAt);
            plan.expiresAt = new Date(plan.expiresAt);
            
            if (plan.completedAt) {
              plan.completedAt = new Date(plan.completedAt);
            }
            
            for (const step of plan.steps) {
              if (step.startedAt) {
                step.startedAt = new Date(step.startedAt);
              }
              
              if (step.completedAt) {
                step.completedAt = new Date(step.completedAt);
              }
            }
            
            this.migrationPlans.set(plan.id, plan);
            logger.debug(`Loaded migration plan ${plan.id} from ${filePath}`);
          } catch (error) {
            logger.error(`Failed to load migration plan from ${file}`, error as Record<string, any>);
          }
        }
      }
      
      logger.info(`Loaded ${this.migrationPlans.size} migration plans`);
    } catch (error) {
      logger.error('Failed to load migration plans', error as Record<string, any>);
    }
  }
  
  /**
   * Save migration plan to storage
   * @param plan Migration plan
   */
  private saveMigrationPlan(plan: MigrationPlan): void {
    try {
      const filePath = path.join(this.storageDir, `${plan.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(plan, null, 2), 'utf8');
      logger.debug(`Saved migration plan ${plan.id} to ${filePath}`);
    } catch (error) {
      logger.error(`Failed to save migration plan ${plan.id}`, error as Record<string, any>);
    }
  }
  
  /**
   * Resume in-progress migrations
   */
  private async resumeMigrations(): Promise<void> {
    try {
      logger.info('Resuming in-progress migrations');
      
      // Find in-progress migrations
      const inProgressPlans = Array.from(this.migrationPlans.values())
        .filter(plan => plan.status === MigrationStatus.IN_PROGRESS);
      
      logger.info(`Found ${inProgressPlans.length} in-progress migrations`);
      
      // Resume each migration
      for (const plan of inProgressPlans) {
        try {
          // Check if plan has expired
          if (plan.expiresAt < new Date()) {
            logger.warn(`Migration plan ${plan.id} has expired, marking as timed out`);
            
            // Mark as timed out
            plan.status = MigrationStatus.TIMED_OUT;
            this.saveMigrationPlan(plan);
            continue;
          }
          
          // Resume migration
          logger.info(`Resuming migration ${plan.id}`);
          this.executeMigration(plan);
        } catch (error) {
          logger.error(`Failed to resume migration ${plan.id}`, error as Record<string, any>);
        }
      }
    } catch (error) {
      logger.error('Failed to resume migrations', error as Record<string, any>);
    }
  }
  
  /**
   * Create a migration plan
   * @param sourceInstanceId Source instance ID
   * @param targetProviderType Target provider type
   * @param options Migration options
   * @returns Migration plan
   */
  public async createMigrationPlan(
    sourceInstanceId: string,
    targetProviderType: ProviderType,
    options?: MigrationOptions
  ): Promise<MigrationPlan> {
    try {
      logger.info(`Creating migration plan for instance ${sourceInstanceId} to provider ${targetProviderType}`);
      
      // Get source instance
      const sourceInstance = this.registry.getInstance(sourceInstanceId);
      
      if (!sourceInstance) {
        throw new Error(`Source instance ${sourceInstanceId} not found`);
      }
      
      // Get source provider
      const sourceProvider = this.providers.get(sourceInstance.providerType);
      
      if (!sourceProvider) {
        throw new Error(`Source provider ${sourceInstance.providerType} not found`);
      }
      
      // Get target provider
      const targetProvider = this.providers.get(targetProviderType);
      
      if (!targetProvider) {
        throw new Error(`Target provider ${targetProviderType} not found`);
      }
      
      // Create migration plan
      const plan: MigrationPlan = {
        id: `migration-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sourceInstanceId,
        sourceProviderType: sourceInstance.providerType,
        targetProviderType,
        strategy: options?.strategy || this.config.migration.defaultStrategy,
        keepSource: options?.keepSource ?? false,
        startTarget: options?.startTarget ?? true,
        timeoutSeconds: options?.timeoutSeconds || Math.floor(this.config.migration.timeoutMs / 1000),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (options?.timeoutSeconds || Math.floor(this.config.migration.timeoutMs / 1000)) * 1000),
        steps: this.createMigrationSteps(sourceInstance.providerType, targetProviderType),
        currentStepIndex: 0,
        status: MigrationStatus.PENDING
      };
      
      // Save plan
      this.migrationPlans.set(plan.id, plan);
      this.saveMigrationPlan(plan);
      
      logger.info(`Created migration plan ${plan.id}`);
      
      return plan;
    } catch (error) {
      logger.error(`Failed to create migration plan for instance ${sourceInstanceId}`, error as Record<string, any>);
      throw error;
    }
  }
  
  /**
   * Create migration steps based on source and target provider types
   * @param sourceProviderType Source provider type
   * @param targetProviderType Target provider type
   * @returns Array of migration steps
   */
  private createMigrationSteps(
    sourceProviderType: ProviderType,
    targetProviderType: ProviderType
  ): MigrationStep[] {
    const steps: MigrationStep[] = [];
    
    // Common steps for all migrations
    steps.push({
      name: 'prepare',
      description: 'Prepare for migration',
      status: MigrationStepStatus.PENDING
    });
    
    steps.push({
      name: 'validate_source',
      description: 'Validate source instance',
      status: MigrationStepStatus.PENDING
    });
    
    steps.push({
      name: 'validate_target_provider',
      description: 'Validate target provider',
      status: MigrationStepStatus.PENDING
    });
    
    // Add steps based on migration strategy
    if (this.config.migration.defaultStrategy === MigrationStrategy.STOP_AND_RECREATE) {
      steps.push({
        name: 'stop_source',
        description: 'Stop source instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'export_source_config',
        description: 'Export source instance configuration',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'create_target',
        description: 'Create target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'start_target',
        description: 'Start target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'verify_target',
        description: 'Verify target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'cleanup_source',
        description: 'Clean up source instance',
        status: MigrationStepStatus.PENDING
      });
    } else if (this.config.migration.defaultStrategy === MigrationStrategy.CREATE_THEN_STOP) {
      steps.push({
        name: 'export_source_config',
        description: 'Export source instance configuration',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'create_target',
        description: 'Create target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'start_target',
        description: 'Start target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'verify_target',
        description: 'Verify target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'stop_source',
        description: 'Stop source instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'cleanup_source',
        description: 'Clean up source instance',
        status: MigrationStepStatus.PENDING
      });
    } else if (this.config.migration.defaultStrategy === MigrationStrategy.EXPORT_IMPORT) {
      steps.push({
        name: 'stop_source',
        description: 'Stop source instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'export_source',
        description: 'Export source instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'create_target',
        description: 'Create target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'import_to_target',
        description: 'Import to target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'start_target',
        description: 'Start target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'verify_target',
        description: 'Verify target instance',
        status: MigrationStepStatus.PENDING
      });
      
      steps.push({
        name: 'cleanup_source',
        description: 'Clean up source instance',
        status: MigrationStepStatus.PENDING
      });
    }
    
    // Final step for all migrations
    steps.push({
      name: 'complete',
      description: 'Complete migration',
      status: MigrationStepStatus.PENDING
    });
    
    return steps;
  }
  
  /**
   * Start a migration
   * @param migrationId Migration ID
   * @returns Migration result
   */
  public async startMigration(migrationId: string): Promise<MigrationResult> {
    try {
      logger.info(`Starting migration ${migrationId}`);
      
      // Get migration plan
      const plan = this.migrationPlans.get(migrationId);
      
      if (!plan) {
        throw new Error(`Migration plan ${migrationId} not found`);
      }
      
      // Check if migration is already in progress
      if (plan.status === MigrationStatus.IN_PROGRESS) {
        throw new Error(`Migration ${migrationId} is already in progress`);
      }
      
      // Check if migration is already completed
      if (plan.status === MigrationStatus.COMPLETED) {
        throw new Error(`Migration ${migrationId} is already completed`);
      }
      
      // Check if migration is already failed
      if (plan.status === MigrationStatus.FAILED) {
        throw new Error(`Migration ${migrationId} has already failed`);
      }
      
      // Check if migration is already cancelled
      if (plan.status === MigrationStatus.CANCELLED) {
        throw new Error(`Migration ${migrationId} has been cancelled`);
      }
      
      // Check if migration is already timed out
      if (plan.status === MigrationStatus.TIMED_OUT) {
        throw new Error(`Migration ${migrationId} has timed out`);
      }
      
      // Update status
      plan.status = MigrationStatus.IN_PROGRESS;
      this.saveMigrationPlan(plan);
      
      // Execute migration
      return this.executeMigration(plan);
    } catch (error) {
      logger.error(`Failed to start migration ${migrationId}`, error as Record<string, any>);
      
      // Create failed result
      const result: MigrationResult = {
        plan: this.migrationPlans.get(migrationId) || {
          id: migrationId,
          sourceInstanceId: '',
          sourceProviderType: ProviderType.UNKNOWN,
          targetProviderType: ProviderType.UNKNOWN,
          strategy: MigrationStrategy.STOP_AND_RECREATE,
          keepSource: false,
          startTarget: true,
          timeoutSeconds: 300,
          createdAt: new Date(),
          expiresAt: new Date(),
          steps: [],
          currentStepIndex: 0,
          status: MigrationStatus.FAILED
        },
        success: false,
        error: `Failed to start migration: ${error}`
      };
      
      return result;
    }
  }
  
  /**
   * Execute a migration
   * @param plan Migration plan
   * @returns Migration result
   */
  private async executeMigration(plan: MigrationPlan): Promise<MigrationResult> {
    try {
      logger.info(`Executing migration ${plan.id}`);
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.handleMigrationTimeout(plan.id);
      }, plan.timeoutSeconds * 1000);
      
      this.migrationTimeouts.set(plan.id, timeoutId);
      
      // Execute steps
      for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
        // Update current step index
        plan.currentStepIndex = i;
        this.saveMigrationPlan(plan);
        
        // Get current step
        const step = plan.steps[i];
        
        // Skip completed steps
        if (step.status === MigrationStepStatus.COMPLETED) {
          continue;
        }
        
        // Execute step
        try {
          logger.info(`Executing migration step ${step.name} for migration ${plan.id}`);
          
          // Update step status
          step.status = MigrationStepStatus.IN_PROGRESS;
          step.startedAt = new Date();
          this.saveMigrationPlan(plan);
          
          // Execute step
          await this.executeStep(plan, step);
          
          // Update step status
          step.status = MigrationStepStatus.COMPLETED;
          step.completedAt = new Date();
          this.saveMigrationPlan(plan);
          
          logger.info(`Completed migration step ${step.name} for migration ${plan.id}`);
        } catch (error) {
          logger.error(`Failed to execute migration step ${step.name} for migration ${plan.id}`, error as Record<string, any>);
          
          // Update step status
          step.status = MigrationStepStatus.FAILED;
          step.error = `${error}`;
          this.saveMigrationPlan(plan);
          
          // Update migration status
          plan.status = MigrationStatus.FAILED;
          plan.error = `Failed to execute step ${step.name}: ${error}`;
          this.saveMigrationPlan(plan);
          
          // Clear timeout
          this.clearMigrationTimeout(plan.id);
          
          // Return failed result
          return {
            plan,
            success: false,
            error: `Failed to execute step ${step.name}: ${error}`
          };
        }
      }
      
      // Update migration status
      plan.status = MigrationStatus.COMPLETED;
      plan.completedAt = new Date();
      this.saveMigrationPlan(plan);
      
      // Clear timeout
      this.clearMigrationTimeout(plan.id);
      
      // Get target instance
      let targetInstance: VSCodeInstance | null = null;
      
      if (plan.targetInstanceId) {
        targetInstance = this.registry.getInstance(plan.targetInstanceId);
      }
      
      logger.info(`Completed migration ${plan.id}`);
      
      // Return success result
      return {
        plan,
        success: true,
        targetInstance: targetInstance || undefined
      };
    } catch (error) {
      logger.error(`Failed to execute migration ${plan.id}`, error as Record<string, any>);
      
      // Update migration status
      plan.status = MigrationStatus.FAILED;
      plan.error = `Failed to execute migration: ${error}`;
      this.saveMigrationPlan(plan);
      
      // Clear timeout
      this.clearMigrationTimeout(plan.id);
      
      // Return failed result
      return {
        plan,
        success: false,
        error: `Failed to execute migration: ${error}`
      };
    }
  }
  
  /**
   * Execute a migration step
   * @param plan Migration plan
   * @param step Migration step
   */
  private async executeStep(plan: MigrationPlan, step: MigrationStep): Promise<void> {
    // Get source instance
    const sourceInstance = this.registry.getInstance(plan.sourceInstanceId);
    
    if (!sourceInstance) {
      throw new Error(`Source instance ${plan.sourceInstanceId} not found`);
    }
    
    // Get source provider
    const sourceProvider = this.providers.get(sourceInstance.providerType);
    
    if (!sourceProvider) {
      throw new Error(`Source provider ${sourceInstance.providerType} not found`);
    }
    
    // Get target provider
    const targetProvider = this.providers.get(plan.targetProviderType);
    
    if (!targetProvider) {
      throw new Error(`Target provider ${plan.targetProviderType} not found`);
    }
    
    // Execute step based on name
    switch (step.name) {
      case 'prepare':
        // Nothing to do here
        break;
        
      case 'validate_source':
        // Check if source instance exists
        const sourceExists = await sourceProvider.getInstance(plan.sourceInstanceId);
        
        if (!sourceExists) {
          throw new Error(`Source instance ${plan.sourceInstanceId} not found in provider ${sourceInstance.providerType}`);
        }
        break;
        
      case 'validate_target_provider':
        // Check if target provider is available
        const targetCapabilities = targetProvider.getCapabilities();
        
        if (!targetCapabilities.canCreateInstances) {
          throw new Error(`Target provider ${plan.targetProviderType} cannot create instances`);
        }
        break;
        
      case 'stop_source':
        // Stop source instance
        if (sourceInstance.status === InstanceStatus.RUNNING) {
          await sourceProvider.stopInstance(plan.sourceInstanceId);
        }
        break;
        
      case 'export_source_config':
        // Nothing to do here, we already have the config
        break;
        
      case 'export_source':
        // This would be provider-specific
        // For now, we'll just use the instance config
        break;
        
      case 'create_target':
        // Create target instance
        const targetConfig: InstanceConfig = {
          name: `${sourceInstance.name}-migrated`,
          image: sourceInstance.config.image,
          workspacePath: sourceInstance.config.workspacePath,
          resources: sourceInstance.config.resources,
          network: sourceInstance.config.network,
          env: sourceInstance.config.env,
          extensions: sourceInstance.config.extensions,
          auth: sourceInstance.config.auth
        };
        
        const targetInstance = await targetProvider.createInstance(targetConfig);
        
        // Update plan with target instance ID
        plan.targetInstanceId = targetInstance.id;
        this.saveMigrationPlan(plan);
        
        // Register target instance
        this.registry.registerInstance(targetInstance);
        break;
        
      case 'import_to_target':
        // This would be provider-specific
        // For now, we'll just assume the instance was created with the right config
        break;
        
      case 'start_target':
        // Start target instance if needed
        if (plan.startTarget && plan.targetInstanceId) {
          const targetInstance = this.registry.getInstance(plan.targetInstanceId);
          
          if (targetInstance && targetInstance.status !== InstanceStatus.RUNNING) {
            await targetProvider.startInstance(plan.targetInstanceId);
          }
        }
        break;
        
      case 'verify_target':
        // Verify target instance exists
        if (!plan.targetInstanceId) {
          throw new Error('Target instance ID not set');
        }
        
        const targetExists = await targetProvider.getInstance(plan.targetInstanceId);
        
        if (!targetExists) {
          throw new Error(`Target instance ${plan.targetInstanceId} not found in provider ${plan.targetProviderType}`);
        }
        
        // Verify target instance is running if needed
        if (plan.startTarget) {
          if (targetExists.status !== InstanceStatus.RUNNING) {
            throw new Error(`Target instance ${plan.targetInstanceId} is not running`);
          }
        }
        break;
        
      case 'cleanup_source':
        // Delete source instance if needed
        if (!plan.keepSource) {
          await sourceProvider.deleteInstance(plan.sourceInstanceId);
          
          // Remove from registry
          this.registry.removeInstance(plan.sourceInstanceId);
        }
        break;
        
      case 'complete':
        // Nothing to do here
        break;
        
      default:
        logger.warn(`Unknown migration step: ${step.name}`);
        break;
    }
  }
  
  /**
   * Handle migration timeout
   * @param migrationId Migration ID
   */
  private handleMigrationTimeout(migrationId: string): void {
    try {
      logger.warn(`Migration ${migrationId} timed out`);
      
      // Get migration plan
      const plan = this.migrationPlans.get(migrationId);
      
      if (!plan) {
        logger.warn(`Migration plan ${migrationId} not found for timeout handling`);
        return;
      }
      
      // Update migration status
      plan.status = MigrationStatus.TIMED_OUT;
      plan.error = 'Migration timed out';
      this.saveMigrationPlan(plan);
      
      // Clear timeout
      this.clearMigrationTimeout(migrationId);
    } catch (error) {
      logger.error(`Failed to handle migration timeout for ${migrationId}`, error as Record<string, any>);
    }
  }
  
  /**
   * Clear migration timeout
   * @param migrationId Migration ID
   */
  private clearMigrationTimeout(migrationId: string): void {
    const timeoutId = this.migrationTimeouts.get(migrationId);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
