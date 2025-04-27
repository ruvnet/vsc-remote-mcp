"use strict";
/**
 * Providers module
 * Exports all provider components and registers them with the factory
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFactory = void 0;
// Export core provider interfaces and types
__exportStar(require("./core/provider.interface"), exports);
__exportStar(require("./core/instance.interface"), exports);
__exportStar(require("./core/provider-types"), exports);
__exportStar(require("./core/provider-factory"), exports);
__exportStar(require("./core/abstract-provider"), exports);
// Export Docker provider
__exportStar(require("./docker"), exports);
// Import and register all providers
require("./docker");
// Export provider factory for convenience
const provider_factory_1 = require("./core/provider-factory");
Object.defineProperty(exports, "ProviderFactory", { enumerable: true, get: function () { return provider_factory_1.ProviderFactory; } });
//# sourceMappingURL=index.js.map