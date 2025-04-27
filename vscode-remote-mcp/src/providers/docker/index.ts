/**
 * Docker provider module
 * Exports all Docker provider components
 */

// Export Docker provider
export { DockerProvider } from './docker-provider';

// Export Docker types
export {
  DockerInstanceMetadata,
  DockerContainerInfo,
  DockerProviderConfig,
  DockerInstance
} from './docker-types';

// Export Docker command utilities
export { DockerCommandExecutor } from './docker-command';

// Export container utilities
export { ContainerUtils } from './container-utils';

// Export instance storage
export { InstanceStorage } from './instance-storage';

// Export log parser
export { DockerLogParser, LogEntry } from './log-parser';

// Register provider
import { ProviderFactory } from '../core/provider-factory';
import { ProviderType } from '../core/provider-types';
import { DockerProvider } from './docker-provider';

// Register Docker provider with the factory
ProviderFactory.registerProvider(ProviderType.DOCKER, DockerProvider);