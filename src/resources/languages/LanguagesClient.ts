import { BaseClient } from '../../core/BaseClient';
import type { ListLanguagesParams, ListLanguagesResponse, Language } from './types';

/**
 * Client for interacting with SonarQube languages endpoints
 * @since 6.3
 */
export class LanguagesClient extends BaseClient {
  /**
   * List supported programming languages
   * @since 6.3
   * @param params - List parameters
   * @returns List of programming languages
   *
   * @example
   * ```typescript
   * const client = new LanguagesClient(baseUrl, token, organization);
   * const languages = await client.list({ ps: 25 });
   * ```
   */
  async list(params?: ListLanguagesParams): Promise<ListLanguagesResponse> {
    const searchParams = new URLSearchParams();

    if (params?.ps !== undefined) {
      searchParams.append('ps', String(params.ps));
    }
    if (params?.q !== undefined) {
      searchParams.append('q', params.q);
    }

    const query = searchParams.toString();
    return await this.request<ListLanguagesResponse>(
      query ? `/api/languages/list?${query}` : '/api/languages/list',
    );
  }

  /**
   * List all supported programming languages using async iteration
   * @since 6.3
   * @param params - List parameters (ps parameter will be handled automatically)
   * @returns Async iterator of languages
   *
   * @example
   * ```typescript
   * const client = new LanguagesClient(baseUrl, token, organization);
   * for await (const language of client.listAll({ q: 'java' })) {
   *   console.log(language.key, language.name);
   * }
   * ```
   */
  async *listAll(
    params?: Omit<ListLanguagesParams, 'ps'>,
  ): AsyncGenerator<Language, void, unknown> {
    // For languages, we typically want all languages (ps=0) since
    // the total number is usually small
    const response = await this.list({
      ...params,
      ps: 0, // Get all languages
    });

    for (const language of response.languages) {
      yield language;
    }
  }
}
