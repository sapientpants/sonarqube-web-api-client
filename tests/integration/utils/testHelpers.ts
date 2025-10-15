// @ts-nocheck
/**
 * Integration test utilities and helpers
 *
 * Provides retry logic, test assertions, and common patterns
 * for robust integration testing.
 */

/**
 * Retry configuration for flaky test scenarios
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 1.5,
  maxDelayMs: 10000,
};

/**
 * Retries an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier, maxDelayMs } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw new Error(
          `Operation failed after ${maxAttempts.toString()} attempts. Last error: ${lastError.message}`,
        );
      }

      console.warn(
        `Attempt ${attempt.toString()}/${maxAttempts.toString()} failed, retrying in ${currentDelay.toString()}ms...`,
      );
      await sleep(currentDelay);

      // Exponential backoff
      if (backoffMultiplier !== undefined && maxDelayMs !== undefined) {
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
      }
    }
  }

  throw lastError ?? new Error('Unexpected retry failure');
}

/**
 * Waits for a condition to become true with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeoutMs = 10000,
  intervalMs = 500,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Condition not met within ${timeoutMs.toString()}ms timeout`);
}

/**
 * Sleep utility
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a unique test identifier
 */
export function generateTestId(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp.toString()}-${random}`;
}

/**
 * Measures execution time of an operation
 */
export async function measureTime<T>(operation: () => Promise<T>): Promise<{
  result: T;
  durationMs: number;
}> {
  const startTime = Date.now();
  const result = await operation();
  const durationMs = Date.now() - startTime;

  return { result, durationMs };
}

/**
 * Groups test operations for better organization
 */
export function testGroup(name: string, tests: () => void | Promise<void>): void {
  describe(name, () => {
    if (tests.constructor.name === 'AsyncFunction') {
      beforeAll(async () => {
        await (tests as () => Promise<void>)();
      });
    } else {
      (tests as () => void)();
    }
  });
}

/**
 * Skips test conditionally based on environment
 */
export function skipIf(condition: boolean, _reason: string): typeof describe {
  return condition ? describe.skip : describe;
}

/**
 * Skips test if condition is met, otherwise runs it
 */
export function skipUnless(condition: boolean, reason: string): typeof describe {
  return skipIf(!condition, reason);
}

/**
 * Runs test only if condition is met
 */
export function runIf(condition: boolean, _reason: string): typeof describe {
  return condition ? describe : describe.skip;
}

/**
 * Standard error object structure used in integration tests
 */
export interface IntegrationTestError {
  status?: number;
  message?: string;
  code?: string;
}

/**
 * Safely extracts error information from unknown error objects
 * with proper type guarding instead of type assertions
 */
export function extractErrorInfo(error: unknown): IntegrationTestError {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    const result: IntegrationTestError = {};

    if (typeof errorObj['status'] === 'number') {
      result.status = errorObj['status'];
    }
    if (typeof errorObj['message'] === 'string') {
      result.message = errorObj['message'];
    }
    if (typeof errorObj['code'] === 'string') {
      result.code = errorObj['code'];
    }

    return result;
  }

  return {
    message: typeof error === 'string' ? error : String(error),
  };
}

/**
 * Checks if an error indicates a missing API endpoint
 */
export function isApiNotAvailableError(error: IntegrationTestError): boolean {
  return (
    error.status === 404 ||
    error.message?.includes('Unknown url') === true ||
    error.message?.includes('not found') === true
  );
}

/**
 * Checks if an error indicates insufficient permissions
 */
export function isPermissionError(error: IntegrationTestError): boolean {
  return error.status === 403 || error.status === 401;
}

/**
 * Checks if an error indicates validation issues
 */
export function isValidationError(error: IntegrationTestError): boolean {
  return error.status === 400;
}

/**
 * Test timing utilities
 */
export const TEST_TIMING = {
  /**
   * Fast test - should complete quickly
   */
  fast: 5000,

  /**
   * Normal test - standard timeout
   */
  normal: 10000,

  /**
   * Slow test - operations that take time
   */
  slow: 30000,

  /**
   * Very slow test - complex operations
   */
  verySlow: 60000,
};

/**
 * Common test patterns for API validation
 */
export const TEST_PATTERNS = {
  /**
   * Tests basic CRUD operations on a resource
   */
  testCrudOperations<T>(
    resource: string,
    createFn: () => Promise<T>,
    readFn: (id: string) => Promise<T | null>,
    updateFn: (id: string, data: Partial<T>) => Promise<T>,
    deleteFn: (id: string) => Promise<void>,
    extractId: (item: T) => string,
  ): void {
    describe(`${resource} CRUD operations`, () => {
      let createdItem: T;
      let itemId: string;

      test('should create item', async () => {
        createdItem = await createFn();
        itemId = extractId(createdItem);
        expect(createdItem).toBeDefined();
        expect(itemId).toBeTruthy();
      });

      test('should read created item', async () => {
        const item = await readFn(itemId);
        expect(item).toBeDefined();
        expect(extractId(item as T)).toBe(itemId);
      });

      test('should update item', async () => {
        const updates = {}; // Define updates based on resource type
        const updatedItem = await updateFn(itemId, updates);
        expect(updatedItem).toBeDefined();
      });

      test('should delete item', async () => {
        await deleteFn(itemId);
        const deletedItem = await readFn(itemId);
        expect(deletedItem).toBeNull();
      });
    });
  },

  /**
   * Tests pagination on a list endpoint
   */
  testPagination(
    resource: string,
    listFn: (page: number, pageSize: number) => Promise<{ items: unknown[]; total: number }>,
  ): void {
    describe(`${resource} pagination`, () => {
      test('should handle page size limits', async () => {
        const response = await listFn(1, 10);
        expect(response.items).toHaveLength(Math.min(10, response.total));
      });

      test('should handle page navigation', async () => {
        const page1 = await listFn(1, 5);
        const page2 = await listFn(2, 5);

        if (page1.total > 5) {
          expect(page2.items).toBeDefined();
          expect(page2.items.length).toBeGreaterThan(0);
        }
      });
    });
  },
};
