export { DeprecationManager, deprecated } from './DeprecationManager';
export type { DeprecationContext, DeprecationOptions } from './DeprecationManager';

export { Deprecated, DeprecatedClass, DeprecatedParameter } from './decorators';

export { DeprecationRegistry } from './DeprecationMetadata';
export type { DeprecationMetadata, MigrationExample } from './DeprecationMetadata';

export {
  CompatibilityBridge,
  withCompatibility,
  UserApiV1ToV2Mappings,
} from './CompatibilityBridge';
export type { ApiMapping } from './CompatibilityBridge';

export { MigrationAssistant } from './MigrationAssistant';
export type { MigrationSuggestion, MigrationReport } from './MigrationAssistant';
