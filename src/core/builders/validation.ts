/**
 * Shared validation utilities for builders
 */

/**
 * Check if a value is a non-empty string
 */
export function isRequired(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

/**
 * Validate that a field is required (non-empty string)
 * @throws Error if validation fails
 */
export function validateRequired(value: unknown, fieldName: string): void {
  if (!isRequired(value)) {
    throw new Error(`${fieldName} is required`);
  }
}

/**
 * Validate OAuth credentials
 * @throws Error if validation fails
 */
export function validateOAuth(
  clientId: unknown,
  clientSecret: unknown,
  providerName = 'OAuth'
): void {
  if (!isRequired(clientId) || !isRequired(clientSecret)) {
    throw new Error(`${providerName} client ID and secret are required`);
  }
}
