"use strict";
/**
 * Common types for the Provider Abstraction Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceStatus = exports.ProviderType = void 0;
/**
 * Provider type enum
 */
var ProviderType;
(function (ProviderType) {
    ProviderType["DOCKER"] = "docker";
    ProviderType["FLYIO"] = "flyio";
})(ProviderType || (exports.ProviderType = ProviderType = {}));
/**
 * Instance status enum
 */
var InstanceStatus;
(function (InstanceStatus) {
    InstanceStatus["CREATING"] = "creating";
    InstanceStatus["RUNNING"] = "running";
    InstanceStatus["STOPPED"] = "stopped";
    InstanceStatus["FAILED"] = "failed";
    InstanceStatus["DELETED"] = "deleted";
})(InstanceStatus || (exports.InstanceStatus = InstanceStatus = {}));
//# sourceMappingURL=provider-types.js.map