export { DeprecationManager, deprecated } from './DeprecationManager.js';
export type { DeprecationContext, DeprecationOptions } from './DeprecationManager.js';

export { Deprecated, DeprecatedClass, DeprecatedParameter } from './decorators.js';

export { DeprecationRegistry } from './DeprecationMetadata.js';
export type { DeprecationMetadata, MigrationExample } from './DeprecationMetadata.js';

export { CompatibilityBridge, UserApiV1ToV2Mappings } from './CompatibilityBridge.js';
export type { ApiMapping } from './CompatibilityBridge.js';

// Export the static method as a function
// We need to import it separately to avoid the unbound-method issue
// The binding is intentional - withCompatibility is a static method that doesn't use 'this',
// but we bind it to satisfy the ESLint unbound-method rule and ensure consistent behavior
import { CompatibilityBridge } from './CompatibilityBridge.js';
export const withCompatibility = CompatibilityBridge.withCompatibility.bind(CompatibilityBridge);

export { MigrationAssistant } from './MigrationAssistant.js';
export type { MigrationSuggestion, MigrationReport } from './MigrationAssistant.js';
