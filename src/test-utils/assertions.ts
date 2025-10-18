/**
 * Reusable test assertion helpers for MSW request validation
 */

/**
 * Asserts that a request contains the expected authorization header
 * @param request - The MSW request object
 * @param token - The expected bearer token value
 */
export function assertAuthorizationHeader(request: Request, token: string): void {
  expect(request.headers.get('Authorization')).toBe(`Bearer ${token}`);
}

/**
 * Asserts that a request contains the expected content-type header
 * @param request - The MSW request object
 * @param contentType - The expected content type (defaults to 'application/json')
 */
export function assertContentTypeHeader(request: Request, contentType = 'application/json'): void {
  expect(request.headers.get('Content-Type')).toBe(contentType);
}

/**
 * Asserts common headers for JSON API requests
 * @param request - The MSW request object
 * @param token - The expected bearer token value
 */
export function assertCommonHeaders(request: Request, token: string): void {
  assertAuthorizationHeader(request, token);
  assertContentTypeHeader(request);
}

/**
 * Asserts that a request has no authorization header
 * @param request - The MSW request object
 */
export function assertNoAuthorizationHeader(request: Request): void {
  expect(request.headers.get('Authorization')).toBeNull();
}

/**
 * Asserts query parameters in a request URL
 * @param request - The MSW request object
 * @param params - Object containing expected query parameter key-value pairs
 */
export function assertQueryParams(request: Request, params: Record<string, string>): void {
  const url = new URL(request.url);
  Object.entries(params).forEach(([key, value]) => {
    expect(url.searchParams.get(key)).toBe(value);
  });
}

/**
 * Asserts the request body matches expected data
 * @param request - The MSW request object
 * @param expectedBody - The expected request body
 */
export async function assertRequestBody(request: Request, expectedBody: unknown): Promise<void> {
  const body = await request.json();
  expect(body).toEqual(expectedBody);
}
