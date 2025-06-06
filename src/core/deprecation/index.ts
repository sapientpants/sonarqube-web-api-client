export { DeprecationManager, deprecated } from './DeprecationManager';
export type { DeprecationContext, DeprecationOptions } from './DeprecationManager';

export { Deprecated, DeprecatedClass, DeprecatedParameter } from './decorators';

export { DeprecationRegistry } from './DeprecationMetadata';
export type { DeprecationMetadata, MigrationExample } from './DeprecationMetadata';

export { CompatibilityBridge, UserApiV1ToV2Mappings } from './CompatibilityBridge';
export type { ApiMapping } from './CompatibilityBridge';

// Export the static method as a function
// We need to import it separately to avoid the unbound-method issue
// The binding is intentional - withCompatibility is a static method that doesn't use 'this',
// but we bind it to satisfy the ESLint unbound-method rule and ensure consistent behavior
import { CompatibilityBridge } from './CompatibilityBridge';
export const withCompatibility = CompatibilityBridge.withCompatibility.bind(CompatibilityBridge);

export { MigrationAssistant } from './MigrationAssistant';
export type { MigrationSuggestion, MigrationReport } from './MigrationAssistant';
