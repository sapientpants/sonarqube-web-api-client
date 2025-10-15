/**
 * Helper utilities for settings builders
 */

/**
 * Checks if a parameter value is defined and not empty
 */
export function isValidParam(value: string | undefined): value is string {
  return value !== undefined && value !== '';
}

/**
 * Adds a parameter to URLSearchParams if it's valid
 */
export function addParamIfValid(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void {
  if (isValidParam(value)) {
    params.set(key, value);
  }
}

/**
 * Splits a comma-separated string into an array, handling undefined/empty cases
 */
export function splitKeys(keys: string | undefined): string[] {
  return isValidParam(keys) ? keys.split(',') : [];
}

/**
 * Common methods for builders that support component and organization
 */
export interface ComponentOrganizationMethods<T> {
  component: (component: string) => T;
  organization: (organization: string) => T;
}
