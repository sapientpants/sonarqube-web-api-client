/**
 * Deprecation management system for SonarQube Web API Client
 * Handles warnings, migration guidance, and deprecation tracking
 */

export interface DeprecationContext {
  /** The deprecated API being called */
  api: string;
  /** Recommended replacement API */
  replacement?: string;
  /** Version when API will be removed */
  removeVersion?: string;
  /** Link to migration guide */
  migrationGuide?: string;
  /** Additional context or reasoning */
  reason?: string;
}

export interface DeprecationOptions {
  /** Suppress all deprecation warnings */
  suppressDeprecationWarnings?: boolean;
  /** Throw errors instead of warnings for deprecated usage */
  strictMode?: boolean;
  /** Enhanced migration guidance mode */
  migrationMode?: boolean;
  /** Custom warning handler */
  onDeprecationWarning?: (context: DeprecationContext) => void;
}

/**
 * Manages deprecation warnings and migration guidance for the SonarQube client
 */
export class DeprecationManager {
  private static readonly warnings = new Set<string>();
  private static options: DeprecationOptions = {};

  /**
   * Configure deprecation behavior globally
   */
  static configure(options: DeprecationOptions): void {
    DeprecationManager.options = { ...DeprecationManager.options, ...options };
  }

  /**
   * Warn about deprecated API usage
   */
  static warn(context: DeprecationContext): void {
    const key = context.api;

    // Always track the warning, regardless of suppression
    const hasWarned = DeprecationManager.warnings.has(key);
    if (!hasWarned) {
      DeprecationManager.warnings.add(key);
    }

    // Skip displaying warning if suppressed or already shown
    if (DeprecationManager.options.suppressDeprecationWarnings === true || hasWarned) {
      return;
    }

    // Use custom handler if provided
    if (DeprecationManager.options.onDeprecationWarning) {
      DeprecationManager.options.onDeprecationWarning(context);
      return;
    }

    // In strict mode, throw an error instead of warning
    if (DeprecationManager.options.strictMode === true) {
      throw new Error(DeprecationManager.formatDeprecationMessage(context));
    }

    // Default behavior: console warning
    console.warn(DeprecationManager.formatDeprecationMessage(context));
  }

  /**
   * Clear all recorded warnings (useful for testing)
   */
  static clearWarnings(): void {
    DeprecationManager.warnings.clear();
  }

  /**
   * Get all APIs that have been warned about
   */
  static getWarnedApis(): string[] {
    return Array.from(DeprecationManager.warnings);
  }

  /**
   * Check if a specific API has been warned about
   */
  static hasWarned(api: string): boolean {
    return DeprecationManager.warnings.has(api);
  }

  /**
   * Format a deprecation message for display
   */
  private static formatDeprecationMessage(context: DeprecationContext): string {
    const lines = [
      '🚨 DEPRECATED API USAGE',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `API: ${context.api}`,
    ];

    if (context.reason !== undefined && context.reason.length > 0) {
      lines.push(`Reason: ${context.reason}`);
    }

    if (context.replacement !== undefined && context.replacement.length > 0) {
      lines.push(`Replacement: ${context.replacement}`);
    }

    if (context.removeVersion !== undefined && context.removeVersion.length > 0) {
      lines.push(`⚠️  Will be removed in: ${context.removeVersion}`);
    }

    if (context.migrationGuide !== undefined && context.migrationGuide.length > 0) {
      lines.push(`📖 Migration guide: ${context.migrationGuide}`);
    }

    if (DeprecationManager.options.migrationMode === true) {
      lines.push('');
      lines.push('💡 Run `npx sonarqube-client-migrate` to automatically fix this usage');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return lines.join('\n');
  }
}

/**
 * Decorator for deprecating methods
 */
export function deprecated(
  context: Omit<DeprecationContext, 'api'>,
): (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => any {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor): any {
    // Handle both legacy and modern decorator usage
    if (descriptor) {
      // Legacy decorator usage
      const originalMethod = descriptor.value;

      descriptor.value = function (this: any, ...args: any[]): any {
        DeprecationManager.warn({
          api: `${target.constructor.name}.${propertyKey}()`,
          ...context,
        });
        return originalMethod.apply(this, args);
      };

      return descriptor;
    } else {
      // Modern decorator usage - return a function that replaces the method
      return function (originalMethod: any): any {
        return function (this: any, ...args: any[]): any {
          DeprecationManager.warn({
            api: `${target.name}.${propertyKey}()`,
            ...context,
          });
          return originalMethod.apply(this, args);
        };
      };
    }
  };
}
