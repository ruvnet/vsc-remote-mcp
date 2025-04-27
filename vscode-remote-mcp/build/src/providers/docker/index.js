"use strict";
/**
 * Docker provider module
 * Exports all Docker provider components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerLogParser = exports.InstanceStorage = exports.ContainerUtils = exports.DockerCommandExecutor = exports.DockerProvider = void 0;
// Export Docker provider
var docker_provider_1 = require("./docker-provider");
Object.defineProperty(exports, "DockerProvider", { enumerable: true, get: function () { return docker_provider_1.DockerProvider; } });
// Export Docker command utilities
var docker_command_1 = require("./docker-command");
Object.defineProperty(exports, "DockerCommandExecutor", { enumerable: true, get: function () { return docker_command_1.DockerCommandExecutor; } });
// Export container utilities
var container_utils_1 = require("./container-utils");
Object.defineProperty(exports, "ContainerUtils", { enumerable: true, get: function () { return container_utils_1.ContainerUtils; } });
// Export instance storage
var instance_storage_1 = require("./instance-storage");
Object.defineProperty(exports, "InstanceStorage", { enumerable: true, get: function () { return instance_storage_1.InstanceStorage; } });
// Export log parser
var log_parser_1 = require("./log-parser");
Object.defineProperty(exports, "DockerLogParser", { enumerable: true, get: function () { return log_parser_1.DockerLogParser; } });
// Register provider
const provider_factory_1 = require("../core/provider-factory");
const provider_types_1 = require("../core/provider-types");
const docker_provider_2 = require("./docker-provider");
// Register Docker provider with the factory
provider_factory_1.ProviderFactory.registerProvider(provider_types_1.ProviderType.DOCKER, docker_provider_2.DockerProvider);
//# sourceMappingURL=index.js.map