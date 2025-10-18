/**
 * Utility for building query strings for v2 APIs
 * @since 10.4
 */

import type { PrimitiveValue } from '../types/primitive';

/**
 * Build a query string from parameters for v2 APIs
 *
 * Handles:
 * - Arrays as comma-separated values
 * - Booleans as string values
 * - Dates as ISO 8601 strings
 * - Undefined/null values are omitted
 *
 * @param params - Query parameters
 * @returns URL-encoded query string
 *
 * @example
 * ```typescript
 * const query = buildV2Query({
 *   page: 2,
 *   pageSize: 50,
 *   userIds: ['uuid1', 'uuid2'],
 *   active: true,
 *   createdAfter: new Date('2024-01-01')
 * });
 * // Returns: 'page=2&pageSize=50&userIds=uuid1,uuid2&active=true&createdAfter=2024-01-01T00:00:00.000Z'
 * ```
 */
export function buildV2Query(params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      // v2 APIs use comma-separated arrays
      if (value.length > 0) {
        query.append(key, value.join(','));
      }
    } else if (typeof value === 'boolean') {
      query.append(key, String(value));
    } else if (value instanceof Date) {
      query.append(key, value.toISOString());
    } else if (typeof value === 'string' || typeof value === 'number') {
      query.append(key, String(value));
    } else {
      // Skip other types that can't be properly stringified
      console.warn(`Skipping parameter '${key}' with unsupported type: ${typeof value}`);
    }
  }

  return query.toString();
}

/**
 * Parse a v2 API filter string
 *
 * @param filterString - Filter string in format "field:operator:value"
 * @returns Parsed filter object, or null if the input is invalid
 *
 * @example
 * ```typescript
 * const filter = parseV2Filter('status:eq:active');
 * // Returns: { field: 'status', operator: 'eq', value: 'active' }
 *
 * const invalid = parseV2Filter('invalid');
 * // Returns: null
 * ```
 */
export function parseV2Filter(filterString: string): {
  field: string;
  operator: string;
  value: string;
} | null {
  const parts = filterString.split(':');
  if (parts.length < 3) {
    return null;
  }

  const [field, operator, ...valueParts] = parts;
  const value = valueParts.join(':'); // Handle values with colons

  return { field: field ?? '', operator: operator ?? '', value };
}

/**
 * Build a filter string for v2 APIs
 *
 * @param filters - Array of filter definitions
 * @returns Comma-separated filter string
 *
 * @example
 * ```typescript
 * const filterString = buildV2Filters([
 *   { field: 'status', operator: 'eq', value: 'active' },
 *   { field: 'createdAt', operator: 'gte', value: '2024-01-01' }
 * ]);
 * // Returns: 'status:eq:active,createdAt:gte:2024-01-01'
 * ```
 */
export function buildV2Filters(
  filters: Array<{
    field: string;
    operator: string;
    value: PrimitiveValue;
  }>,
): string {
  return filters
    .map((filter) => `${filter.field}:${filter.operator}:${String(filter.value)}`)
    .join(',');
}
