/**
 * Base client class for resource modules
 */
export abstract class BaseClient {
  constructor(
    protected readonly baseUrl: string,
    protected readonly token?: string
  ) {}

  protected async request<T>(url: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      ['Content-Type']: 'application/json',
      ...(this.token !== undefined &&
        this.token.length > 0 && { ['Authorization']: `Bearer ${this.token}` }),
    };

    const mergedHeaders = {
      ...headers,
      ...(options?.headers !== undefined
        ? Object.fromEntries(Object.entries(options.headers))
        : {}),
    };

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: mergedHeaders,
    });

    if (!response.ok) {
      throw new Error(`SonarQube API error: ${String(response.status)} ${response.statusText}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return undefined as unknown as T;
    }

    return JSON.parse(text) as T;
  }
}
