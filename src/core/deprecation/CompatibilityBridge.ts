/**
 * Compatibility bridge for smooth migration from deprecated APIs to new ones
 */

import { DeprecationManager } from './DeprecationManager';

export interface ApiMapping<TOld = any, TNew = any> {
  oldApi: string;
  newApi: string;
  transformer?: (oldParams: TOld) => TNew;
  resultTransformer?: (newResult: any) => any;
}

/**
 * Provides a compatibility layer that automatically translates old API calls to new ones
 */
export class CompatibilityBridge {
  private static readonly mappings = new Map<string, ApiMapping>();

  /**
   * Register a mapping from old API to new API
   */
  static register<TOld, TNew>(mapping: ApiMapping<TOld, TNew>): void {
    this.mappings.set(mapping.oldApi, mapping);
  }

  /**
   * Create a proxy that intercepts old API calls and redirects to new ones
   */
  static createProxy<T extends object>(target: T, apiPrefix = '', rootTarget?: any): T {
    const root = rootTarget || target;

    return new Proxy(target, {
      get: (obj, prop) => {
        const propName = String(prop);
        const fullApiName = apiPrefix ? `${apiPrefix}.${propName}` : propName;

        // Check if this is a deprecated API
        const mapping = this.mappings.get(fullApiName);

        if (mapping && typeof obj[prop as keyof T] === 'function') {
          // Return a wrapper function that handles the translation
          return this.createCompatibilityWrapper(root, prop as keyof T, mapping);
        }

        // Check if we need to create a nested proxy
        const value = obj[prop as keyof T];
        if (typeof value === 'object' && value !== null) {
          return this.createProxy(value, fullApiName, root);
        }

        return value;
      },
    });
  }

  /**
   * Create a wrapper function that translates old API calls to new ones
   */
  private static createCompatibilityWrapper<T extends object>(
    target: T,
    prop: keyof T,
    mapping: ApiMapping
  ): (...args: any[]) => any {
    return function (this: any, ...args: any[]): any {
      // Emit deprecation warning
      DeprecationManager.warn({
        api: mapping.oldApi,
        replacement: mapping.newApi,
        reason: 'This API has been superseded by a new version',
      });

      // Transform parameters if needed
      const transformedArgs = mapping.transformer ? [mapping.transformer(...args)] : args;

      // Find and call the new API
      const newMethod = CompatibilityBridge.findMethod(target, mapping.newApi);
      if (!newMethod) {
        throw new Error(`Compatibility bridge error: New API '${mapping.newApi}' not found`);
      }

      // Call the new method
      const result = newMethod.apply(this, transformedArgs);

      // Transform result if needed
      if (mapping.resultTransformer) {
        return CompatibilityBridge.transformResult(result, mapping.resultTransformer);
      }

      return result;
    };
  }

  /**
   * Find a method by its path (e.g., "v2.search")
   */
  private static findMethod(obj: any, path: string): Function | undefined {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return typeof current === 'function' ? current : undefined;
  }

  /**
   * Transform async results if needed
   */
  private static async transformResult(
    result: any,
    transformer: (result: any) => any
  ): Promise<any> {
    // Handle promises
    if (result && typeof result.then === 'function') {
      const resolved = await result;
      return transformer(resolved);
    }

    // Handle regular values
    return transformer(result);
  }
}

/**
 * Example V1 to V2 mappings for SonarQube Users API
 */
export const UserApiV1ToV2Mappings: ApiMapping[] = [
  {
    oldApi: 'users.search',
    newApi: 'users.searchV2',
    transformer: (params: any) => {
      // Transform V1 parameters to V2 format
      const v2Params: any = { ...params };

      // Example transformations
      if (params.ps) {
        v2Params.pageSize = params.ps;
        delete v2Params.ps;
      }

      if (params.p) {
        v2Params.page = params.p;
        delete v2Params.p;
      }

      return v2Params;
    },
    resultTransformer: (result: any) => {
      // Transform V2 result back to V1 format for compatibility
      if (result.users) {
        return {
          ...result,
          items: result.users,
        };
      }
      return result;
    },
  },
];

/**
 * Helper to apply compatibility bridge to a client
 */
export function withCompatibility<T extends object>(client: T, mappings: ApiMapping[]): T {
  // Register all mappings
  mappings.forEach((m) => {
    CompatibilityBridge.register(m);
  });

  // Return proxied client
  return CompatibilityBridge.createProxy(client);
}
