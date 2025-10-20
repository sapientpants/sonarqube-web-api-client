import type { BaseBuilder } from '../BaseBuilder.js';

/**
 * Implementation function for boolean parameter methods
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function booleanMethodImpl<T extends BaseBuilder<any, any>>(
  this: T,
  paramName: string,
  defaultValue: boolean,
  value = defaultValue,
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return this.setParam(paramName as any, value as any);
}

/**
 * Implementation function for string parameter methods
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stringMethodImpl<T extends BaseBuilder<any, any>>(
  this: T,
  paramName: string,
  value: string,
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return this.setParam(paramName as any, value as any);
}

/**
 * Implementation function for array parameter methods
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arrayMethodImpl<T extends BaseBuilder<any, any>>(
  this: T,
  paramName: string,
  values: string[],
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return this.setParam(paramName as any, values as any);
}

/**
 * Implementation function for optional string parameter methods
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function optionalStringMethodImpl<T extends BaseBuilder<any, any>>(
  this: T,
  paramName: string,
  value?: string,
): T {
  if (value !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.setParam(paramName as any, value as any);
  }
  return this;
}

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
    defaultValue = true,
  ) {
    return function (this: T, value = defaultValue): T {
      return booleanMethodImpl.call(this, paramName, defaultValue, value) as T;
    };
  }

  /**
   * Creates a method for setting string parameters
   * @param paramName - The parameter name
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createStringMethod<T extends BaseBuilder<any, any>>(paramName: string) {
    return function (this: T, value: string): T {
      return stringMethodImpl.call(this, paramName, value) as T;
    };
  }

  /**
   * Creates a method for setting array parameters
   * @param paramName - The parameter name
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createArrayMethod<T extends BaseBuilder<any, any>>(paramName: string) {
    return function (this: T, values: string[]): T {
      return arrayMethodImpl.call(this, paramName, values) as T;
    };
  }

  /**
   * Creates a method for setting optional string parameters
   * @param paramName - The parameter name
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createOptionalStringMethod<T extends BaseBuilder<any, any>>(paramName: string) {
    return function (this: T, value?: string): T {
      return optionalStringMethodImpl.call(this, paramName, value) as T;
    };
  }
}
