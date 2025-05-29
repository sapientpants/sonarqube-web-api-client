/**
 * Enhanced decorators for deprecation management
 */

import { DeprecationManager } from './DeprecationManager';
import type { DeprecationMetadata } from './DeprecationMetadata';
import { DeprecationRegistry } from './DeprecationMetadata';

type AnyFunction = (...args: any[]) => any;
type Constructor = new (...args: any[]) => any;

/**
 * Enhanced deprecation decorator that integrates with TypeScript's @deprecated JSDoc
 * and provides runtime warnings with rich metadata
 */
export function Deprecated(metadata: Omit<DeprecationMetadata, 'api'>) {
  return function <T extends AnyFunction>(target: T, context: ClassMethodDecoratorContext): T {
    const methodName = String(context.name);

    // Return wrapped function
    const wrapper = function (this: any, ...args: Parameters<T>): ReturnType<T> {
      // Get class name at runtime from 'this'
      const className = (this?.constructor?.name as string) ?? 'Unknown';
      const api = `${className}.${methodName}()`;

      // Register metadata for tooling (if not already registered)
      if (!DeprecationRegistry.get(api)) {
        DeprecationRegistry.register({
          ...metadata,
          api,
        });
      }

      // Check if we're past removal date
      const removalDate = new Date(metadata.removalDate);
      const now = new Date();

      if (now >= removalDate) {
        console.error(
          `❌ CRITICAL: ${api} was scheduled for removal on ${metadata.removalDate} and should no longer be used!`
        );
      }

      // Emit deprecation warning with enhanced context
      DeprecationManager.warn({
        api,
        ...(metadata.replacement ? { replacement: metadata.replacement } : {}),
        removeVersion: metadata.removalDate,
        ...(metadata.migrationGuide ? { migrationGuide: metadata.migrationGuide } : {}),
        reason: metadata.reason,
      });

      // If migration examples exist, show one
      if (metadata.examples && metadata.examples.length > 0) {
        const example = metadata.examples[0];
        if (example) {
          console.log('\n📝 Migration Example:');
          console.log('Before:', example.before);
          console.log('After:', example.after);
          if (example.description) {
            console.log('Note:', example.description);
          }
        }
      }

      // Call original method
      return target.apply(this, args) as ReturnType<T>;
    } as T;

    // Copy over any properties from the original function
    Object.setPrototypeOf(wrapper, target);
    Object.getOwnPropertyNames(target).forEach((prop) => {
      if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
        const descriptor = Object.getOwnPropertyDescriptor(target, prop);
        if (descriptor) {
          Object.defineProperty(wrapper, prop, descriptor);
        }
      }
    });

    return wrapper;
  };
}

/**
 * Decorator for marking entire classes as deprecated
 */
export function DeprecatedClass(metadata: Omit<DeprecationMetadata, 'api'>) {
  return function <T extends Constructor>(target: T, _context: ClassDecoratorContext): T {
    const className = target.name;
    const api = className;

    // Register metadata
    DeprecationRegistry.register({
      ...metadata,
      api,
    });

    // Return wrapped constructor
    return class extends target {
      constructor(...args: any[]) {
        DeprecationManager.warn({
          api,
          ...(metadata.replacement ? { replacement: metadata.replacement } : {}),
          removeVersion: metadata.removalDate,
          ...(metadata.migrationGuide ? { migrationGuide: metadata.migrationGuide } : {}),
          reason: metadata.reason,
        });

        super(...args);
      }
    } as T;
  };
}

/**
 * Decorator for parameters that will be removed
 */
export function DeprecatedParameter(parameterName: string, metadata: Partial<DeprecationMetadata>) {
  return function <T extends AnyFunction>(target: T, context: ClassMethodDecoratorContext): T {
    const methodName = String(context.name);
    const className =
      context.kind === 'method' ? ((target as any).constructor.name as string) : 'Unknown';

    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
      // Check if deprecated parameter is being used
      const paramIndex = target.length - 1; // Assuming it's checking the last parameter
      if (args[paramIndex] !== undefined) {
        console.warn(
          `⚠️  Parameter '${parameterName}' in ${className}.${methodName}() is deprecated. ${
            metadata.reason ?? ''
          }`
        );
        if (metadata.replacement) {
          console.warn(`   Use '${metadata.replacement}' instead.`);
        }
      }

      return target.apply(this, args) as ReturnType<T>;
    } as T;
  };
}
