/**
 * Enhanced decorators for deprecation management
 */

import { DeprecationManager } from './DeprecationManager.js';
import type { DeprecationMetadata } from './DeprecationMetadata.js';
import { DeprecationRegistry } from './DeprecationMetadata.js';

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
    const wrapper = createDeprecatedWrapper(target, methodName, metadata);

    // Copy over any properties from the original function
    copyFunctionProperties(wrapper, target);

    return wrapper;
  };
}

function createDeprecatedWrapper<T extends AnyFunction>(
  target: T,
  methodName: string,
  metadata: Omit<DeprecationMetadata, 'api'>,
): T {
  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    // Get class name at runtime from 'this'
    const className = (this?.constructor?.name as string) ?? 'Unknown';
    const api = `${className}.${methodName}()`;

    // Register and validate
    registerDeprecationMetadata(api, metadata);
    validateRemovalDate(api, metadata.removalDate);

    // Emit deprecation warning with enhanced context
    emitDeprecationWarning(api, metadata);

    // Show migration examples if available
    showMigrationExamples(metadata);

    // Call original method
    return target.apply(this, args) as ReturnType<T>;
  } as T;
}

function registerDeprecationMetadata(
  api: string,
  metadata: Omit<DeprecationMetadata, 'api'>,
): void {
  // Register metadata for tooling (if not already registered)
  if (!DeprecationRegistry.get(api)) {
    DeprecationRegistry.register({
      ...metadata,
      api,
    });
  }
}

function validateRemovalDate(api: string, removalDateString: string): void {
  // Check if we're past removal date
  const removalDate = new Date(removalDateString);
  const now = new Date();

  if (now >= removalDate) {
    // eslint-disable-next-line no-console
    console.error(
      `❌ CRITICAL: ${api} was scheduled for removal on ${removalDateString} and should no longer be used!`,
    );
  }
}

function emitDeprecationWarning(api: string, metadata: Omit<DeprecationMetadata, 'api'>): void {
  DeprecationManager.warn({
    api,
    ...(metadata.replacement ? { replacement: metadata.replacement } : {}),
    removeVersion: metadata.removalDate,
    ...(metadata.migrationGuide ? { migrationGuide: metadata.migrationGuide } : {}),
    reason: metadata.reason,
  });
}

function showMigrationExamples(metadata: Omit<DeprecationMetadata, 'api'>): void {
  // If migration examples exist, show one
  if (!metadata.examples || metadata.examples.length === 0) {
    return;
  }

  const example = metadata.examples[0];
  if (!example) {
    return;
  }

  /* eslint-disable no-console */
  console.log('\n📝 Migration Example:');
  console.log('Before:', example.before);
  console.log('After:', example.after);
  if (example.description) {
    console.log('Note:', example.description);
  }
  /* eslint-enable no-console */
}

function copyFunctionProperties<T extends AnyFunction>(wrapper: T, target: T): void {
  Object.setPrototypeOf(wrapper, target);
  for (const prop of Object.getOwnPropertyNames(target)) {
    if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
      const descriptor = Object.getOwnPropertyDescriptor(target, prop);
      if (descriptor) {
        Object.defineProperty(wrapper, prop, descriptor);
      }
    }
  }
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
 * Note: This requires the parameter index to be specified explicitly
 * because TypeScript 5.x parameter decorators don't provide the index in the context
 */
export function DeprecatedParameter(
  parameterIndex: number,
  parameterName: string,
  metadata: Partial<DeprecationMetadata>,
) {
  return function <T extends AnyFunction>(target: T, context: ClassMethodDecoratorContext): T {
    const methodName = String(context.name);

    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
      // Get class name at runtime from 'this'
      // 'Unknown' is used when the method is called without a proper class context
      // (e.g., when destructured or called as a standalone function)
      const className = this?.constructor?.name ?? 'Unknown';

      // Check if deprecated parameter is being used
      if (args[parameterIndex] !== undefined) {
        // eslint-disable-next-line no-console
        console.warn(
          `⚠️  Parameter '${parameterName}' in ${className}.${methodName}() is deprecated. ${
            metadata.reason ?? ''
          }`,
        );
        if (metadata.replacement) {
          // eslint-disable-next-line no-console
          console.warn(`   Use '${metadata.replacement}' instead.`);
        }
      }

      return target.apply(this, args) as ReturnType<T>;
    } as T;
  };
}
