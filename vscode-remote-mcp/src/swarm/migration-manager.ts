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
 * Migration step status
 */
export enum MigrationStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * Migration status
 */
export enum MigrationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMED_OUT = 'timed_out'
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
export class MigrationManager {
  private registry: InstanceRegistry;
  private providers: Map<ProviderType, Provider>;
  private config: SwarmConfig;
  private migrationPlans: Map<string, MigrationPlan> = new Map();
  private storageDir: string;
  private migrationTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Constructor
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
    this.loadMigrationPlans();
    await this.resumeMigrations();
    logger.info('Migration manager initialized');
  }
  
  /**
   * Load migration plans from storage
   */
  private loadMigrationPlans(): void {
    try {
      logger.info(`Loading migration plans from ${this.storageDir}`);
      this.migrationPlans.clear();
      
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
            if (plan.completedAt) plan.completedAt = new Date(plan.completedAt);
            
            for (const step of plan.steps) {
              if (step.startedAt) step.startedAt = new Date(step.startedAt);
              if (step.completedAt) step.completedAt = new Date(step.completedAt);
            }
            
            this.migrationPlans.set(plan.id, plan);
            logger.debug(`Loaded migration plan ${plan.id}`);
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
   */
  private saveMigrationPlan(plan: MigrationPlan): void {
    try {
      const filePath = path.join(this.storageDir, `${plan.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(plan, null, 2), 'utf8');
    } catch (error) {
      logger.error(`Failed to save migration plan ${plan.id}`, error as Record<string, any>);
    }
  }
  
  /**
   * Resume in-progress migrations
   */
  private async resumeMigrations(): Promise<void> {
    try {
      const inProgressPlans = Array.from(this.migrationPlans.values())
        .filter(plan => plan.status === MigrationStatus.IN_PROGRESS);
      
      logger.info(`Found ${inProgressPlans.length} in-progress migrations`);
      
      for (const plan of inProgressPlans) {
        try {
          if (plan.expiresAt < new Date()) {
            plan.status = MigrationStatus.TIMED_OUT;
            this.saveMigrationPlan(plan);
            continue;
          }
          
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
   */
  public async createMigrationPlan(
    sourceInstanceId: string,
    targetProviderType: ProviderType,
    options?: MigrationOptions
  ): Promise<MigrationPlan> {
    try {
      const sourceInstance = this.registry.getInstance(sourceInstanceId);
      if (!sourceInstance) throw new Error(`Source instance ${sourceInstanceId} not found`);
      
      const sourceProvider = this.providers.get(sourceInstance.providerType);
      if (!sourceProvider) throw new Error(`Source provider ${sourceInstance.providerType} not found`);
      
      const targetProvider = this.providers.get(targetProviderType);
      if (!targetProvider) throw new Error(`Target provider ${targetProviderType} not found`);
      
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
      
      this.migrationPlans.set(plan.id, plan);
      this.saveMigrationPlan(plan);
      
      return plan;
    } catch (error) {
      logger.error(`Failed to create migration plan for instance ${sourceInstanceId}`, error as Record<string, any>);
      throw error;
    }
  }
  
  /**
   * Create migration steps based on source and target provider types
   */
  private createMigrationSteps(
    sourceProviderType: ProviderType,
    targetProviderType: ProviderType
  ): MigrationStep[] {
    const steps: MigrationStep[] = [
      {
        name: 'prepare',
        description: 'Prepare for migration',
        status: MigrationStepStatus.PENDING
      },
      {
        name: 'validate_source',
        description: 'Validate source instance',
        status: MigrationStepStatus.PENDING
      },
      {
        name: 'validate_target_provider',
        description: 'Validate target provider',
        status: MigrationStepStatus.PENDING
      }
    ];
    
    // Add steps based on migration strategy
    if (this.config.migration.defaultStrategy === MigrationStrategy.STOP_AND_RECREATE) {
      steps.push(
        {
          name: 'stop_source',
          description: 'Stop source instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'export_source_config',
          description: 'Export source instance configuration',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'create_target',
          description: 'Create target instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'start_target',
          description: 'Start target instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'verify_target',
          description: 'Verify target instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'cleanup_source',
          description: 'Clean up source instance',
          status: MigrationStepStatus.PENDING
        }
      );
    } else if (this.config.migration.defaultStrategy === MigrationStrategy.CREATE_THEN_STOP) {
      steps.push(
        {
          name: 'export_source_config',
          description: 'Export source instance configuration',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'create_target',
          description: 'Create target instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'start_target',
          description: 'Start target instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'verify_target',
          description: 'Verify target instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'stop_source',
          description: 'Stop source instance',
          status: MigrationStepStatus.PENDING
        },
        {
          name: 'cleanup_source',
          description: 'Clean up source instance',
          status: MigrationStepStatus.PENDING
        }
      );
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
   */
  public async startMigration(migrationId: string): Promise<MigrationResult> {
    try {
      const plan = this.migrationPlans.get(migrationId);
      if (!plan) throw new Error(`Migration plan ${migrationId} not found`);
      
      if (plan.status === MigrationStatus.IN_PROGRESS) {
        throw new Error(`Migration ${migrationId} is already in progress`);
      }
      
      plan.status = MigrationStatus.IN_PROGRESS;
      this.saveMigrationPlan(plan);
      
      return this.executeMigration(plan);
    } catch (error) {
      logger.error(`Failed to start migration ${migrationId}`, error as Record<string, any>);
      
      const result: MigrationResult = {
        plan: this.migrationPlans.get(migrationId) || {
          id: migrationId,
          sourceInstanceId: '',
          sourceProviderType: ProviderType.DOCKER,
          targetProviderType: ProviderType.DOCKER,
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
   */
  private async executeMigration(plan: MigrationPlan): Promise<MigrationResult> {
    try {
      const timeoutId = setTimeout(() => {
        this.handleMigrationTimeout(plan.id);
      }, plan.timeoutSeconds * 1000);
      
      this.migrationTimeouts.set(plan.id, timeoutId);
      
      for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
        plan.currentStepIndex = i;
        this.saveMigrationPlan(plan);
        
        const step = plan.steps[i];
        if (step.status === MigrationStepStatus.COMPLETED) continue;
        
        try {
          step.status = MigrationStepStatus.IN_PROGRESS;
          step.startedAt = new Date();
          this.saveMigrationPlan(plan);
          
          await this.executeStep(plan, step);
          
          step.status = MigrationStepStatus.COMPLETED;
          step.completedAt = new Date();
          this.saveMigrationPlan(plan);
        } catch (error) {
          step.status = MigrationStepStatus.FAILED;
          step.error = `${error}`;
          
          plan.status = MigrationStatus.FAILED;
          plan.error = `Failed to execute step ${step.name}: ${error}`;
          this.saveMigrationPlan(plan);
          
          this.clearMigrationTimeout(plan.id);
          
          return {
            plan,
            success: false,
            error: `Failed to execute step ${step.name}: ${error}`
          };
        }
      }
      
      plan.status = MigrationStatus.COMPLETED;
      plan.completedAt = new Date();
      this.saveMigrationPlan(plan);
      
      this.clearMigrationTimeout(plan.id);
      
      let targetInstance: VSCodeInstance | null = null;
      if (plan.targetInstanceId) {
        targetInstance = this.registry.getInstance(plan.targetInstanceId);
      }
      
      return {
        plan,
        success: true,
        targetInstance: targetInstance || undefined
      };
    } catch (error) {
      plan.status = MigrationStatus.FAILED;
      plan.error = `Failed to execute migration: ${error}`;
      this.saveMigrationPlan(plan);
      
      this.clearMigrationTimeout(plan.id);
      
      return {
        plan,
        success: false,
        error: `Failed to execute migration: ${error}`
      };
    }
  }
  
  /**
   * Execute a migration step
   */
  private async executeStep(plan: MigrationPlan, step: MigrationStep): Promise<void> {
    const sourceInstance = this.registry.getInstance(plan.sourceInstanceId);
    if (!sourceInstance) throw new Error(`Source instance ${plan.sourceInstanceId} not found`);
    
    const sourceProvider = this.providers.get(sourceInstance.providerType);
    if (!sourceProvider) throw new Error(`Source provider ${sourceInstance.providerType} not found`);
    
    const targetProvider = this.providers.get(plan.targetProviderType);
    if (!targetProvider) throw new Error(`Target provider ${plan.targetProviderType} not found`);
    
    switch (step.name) {
      case 'prepare':
        // Nothing to do here
        break;
        
      case 'validate_source':
        const sourceExists = await sourceProvider.getInstance(plan.sourceInstanceId);
        if (!sourceExists) {
          throw new Error(`Source instance ${plan.sourceInstanceId} not found in provider ${sourceInstance.providerType}`);
        }
        break;
        
      case 'validate_target_provider':
        // All providers should be able to create instances since they implement the Provider interface
        // Just check if the provider is initialized
        const targetCapabilities = targetProvider.getCapabilities();
        if (targetCapabilities.maxInstancesPerUser <= 0) {
          throw new Error(`Target provider ${plan.targetProviderType} cannot create instances (maxInstancesPerUser: ${targetCapabilities.maxInstancesPerUser})`);
        }
        break;
        
      case 'stop_source':
        if (sourceInstance.status === InstanceStatus.RUNNING) {
          await sourceProvider.stopInstance(plan.sourceInstanceId);
        }
        break;
        
      case 'create_target':
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
        plan.targetInstanceId = targetInstance.id;
        this.saveMigrationPlan(plan);
        this.registry.registerInstance(targetInstance);
        break;
        
      case 'start_target':
        if (plan.startTarget && plan.targetInstanceId) {
          const targetInstance = this.registry.getInstance(plan.targetInstanceId);
          if (targetInstance && targetInstance.status !== InstanceStatus.RUNNING) {
            await targetProvider.startInstance(plan.targetInstanceId);
          }
        }
        break;
        
      case 'verify_target':
        if (!plan.targetInstanceId) {
          throw new Error('Target instance ID not set');
        }
        
        const targetExists = await targetProvider.getInstance(plan.targetInstanceId);
        if (!targetExists) {
          throw new Error(`Target instance ${plan.targetInstanceId} not found in provider ${plan.targetProviderType}`);
        }
        
        if (plan.startTarget && targetExists.status !== InstanceStatus.RUNNING) {
          throw new Error(`Target instance ${plan.targetInstanceId} is not running`);
        }
        break;
        
      case 'cleanup_source':
        if (!plan.keepSource) {
          await sourceProvider.deleteInstance(plan.sourceInstanceId);
          this.registry.removeInstance(plan.sourceInstanceId);
        }
        break;
    }
  }
  
  /**
   * Handle migration timeout
   */
  private handleMigrationTimeout(migrationId: string): void {
    try {
      const plan = this.migrationPlans.get(migrationId);
      if (!plan) return;
      
      plan.status = MigrationStatus.TIMED_OUT;
      plan.error = 'Migration timed out';
      this.saveMigrationPlan(plan);
      
      this.clearMigrationTimeout(migrationId);
    } catch (error) {
      logger.error(`Failed to handle migration timeout for ${migrationId}`, error as Record<string, any>);
    }
  }
  
  /**
   * Clear migration timeout
   */
  private clearMigrationTimeout(migrationId: string): void {
    const timeoutId = this.migrationTimeouts.get(migrationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.migrationTimeouts.delete(migrationId);
    }
  }
  
  /**
   * Cancel a migration
   */
  public async cancelMigration(migrationId: string): Promise<boolean> {
    try {
      const plan = this.migrationPlans.get(migrationId);
      if (!plan) throw new Error(`Migration plan ${migrationId} not found`);
      
      if (plan.status !== MigrationStatus.PENDING && plan.status !== MigrationStatus.IN_PROGRESS) {
        throw new Error(`Migration ${migrationId} cannot be cancelled (status: ${plan.status})`);
      }
      
      plan.status = MigrationStatus.CANCELLED;
      plan.error = 'Migration cancelled by user';
      this.saveMigrationPlan(plan);
      
      this.clearMigrationTimeout(migrationId);
      
      return true;
    } catch (error) {
      logger.error(`Failed to cancel migration ${migrationId}`, error as Record<string, any>);
      return false;
    }
  }
  
  /**
   * Get a migration plan
   */
  public getMigrationPlan(migrationId: string): MigrationPlan | null {
    return this.migrationPlans.get(migrationId) || null;
  }
  
  /**
   * List migration plans
   */
  public listMigrationPlans(status?: MigrationStatus): MigrationPlan[] {
    const plans = Array.from(this.migrationPlans.values());
    return status ? plans.filter(plan => plan.status === status) : plans;
  }
  
  /**
   * Dispose of migration manager resources
   */
  public dispose(): void {
    // Clear all timeouts
    for (const [id, timeoutId] of this.migrationTimeouts.entries()) {
      clearTimeout(timeoutId);
    }
    
    this.migrationTimeouts.clear();
  }
}
