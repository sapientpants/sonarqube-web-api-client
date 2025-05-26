import type { BaseBuilder } from '../BaseBuilder';

/**
 * Helper utilities for creating common parameter methods in builders
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ParameterHelpers {
  /**
   * Creates a method for setting boolean parameters with optional default value
   * @param paramName - The parameter name
   * @param defaultValue - Default value when called without arguments (default: true)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createBooleanMethod<T extends BaseBuilder<any, any>>(
    paramName: string,
    defaultValue = true
  ) {
    return function (this: T, value = defaultValue): T {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.setParam(paramName as any, value as any);
    };
  }

  /**
   * Creates a method for setting string parameters
   * @param paramName - The parameter name
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createStringMethod<T extends BaseBuilder<any, any>>(paramName: string) {
    return function (this: T, value: string): T {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.setParam(paramName as any, value as any);
    };
  }

  /**
   * Creates a method for setting array parameters
   * @param paramName - The parameter name
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createArrayMethod<T extends BaseBuilder<any, any>>(paramName: string) {
    return function (this: T, values: string[]): T {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return this.setParam(paramName as any, values as any);
    };
  }

  /**
   * Creates a method for setting optional string parameters
   * @param paramName - The parameter name
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createOptionalStringMethod<T extends BaseBuilder<any, any>>(paramName: string) {
    return function (this: T, value?: string): T {
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.setParam(paramName as any, value as any);
      }
      return this;
    };
  }
}
