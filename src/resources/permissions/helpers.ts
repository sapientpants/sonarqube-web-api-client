/**
 * Helper utilities for permissions
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
  value: string | undefined
): void {
  if (isValidParam(value)) {
    params.set(key, value);
  }
}
