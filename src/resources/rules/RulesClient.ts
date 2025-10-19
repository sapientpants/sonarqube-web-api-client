import { BaseClient } from '../../core/BaseClient';
import { SearchRulesBuilder } from './builders';
import type {
  ListRepositoriesRequest,
  ListRepositoriesResponse,
  SearchRulesRequest,
  SearchRulesResponse,
  ShowRuleRequest,
  ShowRuleResponse,
  ListTagsRequest,
  ListTagsResponse,
  UpdateRuleRequest,
  UpdateRuleResponse,
} from './types';

/**
 * Client for managing SonarQube rules
 */
export class RulesClient extends BaseClient {
  /**
   * List available rule repositories
   * @param params - Request parameters
   * @returns List of rule repositories
   * @throws {Error} If the request fails
   */
  async listRepositories(params?: ListRepositoriesRequest): Promise<ListRepositoriesResponse> {
    const searchParams = new URLSearchParams();

    if (params?.language !== undefined && params.language.length > 0) {
      searchParams.append('language', params.language);
    }
    if (params?.q !== undefined && params.q.length > 0) {
      searchParams.append('q', params.q);
    }

    const query = searchParams.toString();
    const url = query ? `/api/rules/repositories?${query}` : '/api/rules/repositories';

    return this.request<ListRepositoriesResponse>(url);
  }

  /**
   * Search for rules with advanced filtering and pagination support
   * @returns Builder for constructing complex search queries
   */
  search(): SearchRulesBuilder {
    return new SearchRulesBuilder(async (params: SearchRulesRequest) =>
      this.searchExecutor(params),
    );
  }

  /**
   * Get detailed information about a rule
   * @param params - Request parameters
   * @returns Detailed rule information
   * @throws {Error} If the request fails
   */
  async show(params: ShowRuleRequest): Promise<ShowRuleResponse> {
    const searchParams = new URLSearchParams({
      key: params.key,
      organization: params.organization,
    });

    if (params.actives !== undefined) {
      searchParams.append('actives', params.actives.toString());
    }

    return this.request<ShowRuleResponse>(`/api/rules/show?${searchParams.toString()}`);
  }

  /**
   * List rule tags
   * @param params - Request parameters
   * @returns List of rule tags
   * @throws {Error} If the request fails
   */
  async listTags(params: ListTagsRequest): Promise<ListTagsResponse> {
    const searchParams = new URLSearchParams({
      organization: params.organization,
    });

    if (params.ps !== undefined) {
      searchParams.append('ps', params.ps.toString());
    }
    if (params.q !== undefined && params.q.length > 0) {
      searchParams.append('q', params.q);
    }

    return this.request<ListTagsResponse>(`/api/rules/tags?${searchParams.toString()}`);
  }

  /**
   * Update an existing rule
   * @param params - Request parameters
   * @returns The updated rule
   * @throws {Error} If the request fails
   * @requires Administer Quality Profiles permission
   */
  async update(params: UpdateRuleRequest): Promise<UpdateRuleResponse> {
    const body: Record<string, string> = {
      key: params.key,
      organization: params.organization,
    };

    if (params.markdown_description !== undefined) {
      body['markdown_description'] = params.markdown_description;
    }
    if (params.markdown_note !== undefined) {
      body['markdown_note'] = params.markdown_note;
    }
    if (params.name !== undefined) {
      body['name'] = params.name;
    }
    if (params.params !== undefined) {
      body['params'] = params.params;
    }
    if (params.remediation_fn_base_effort !== undefined) {
      body['remediation_fn_base_effort'] = params.remediation_fn_base_effort;
    }
    if (params.remediation_fn_type !== undefined) {
      body['remediation_fn_type'] = params.remediation_fn_type;
    }
    if (params.remediation_fy_gap_multiplier !== undefined) {
      body['remediation_fy_gap_multiplier'] = params.remediation_fy_gap_multiplier;
    }
    if (params.severity !== undefined) {
      body['severity'] = params.severity;
    }
    if (params.status !== undefined) {
      body['status'] = params.status;
    }
    if (params.tags !== undefined) {
      body['tags'] = params.tags;
    }

    return this.request<UpdateRuleResponse>('/api/rules/update', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Execute search request with proper parameter handling
   */
  private async searchExecutor(params: SearchRulesRequest): Promise<SearchRulesResponse> {
    const searchParams = new URLSearchParams();

    // Handle array parameters by joining with commas
    const arrayParams: Array<keyof SearchRulesRequest> = [
      'active_severities',
      'cleanCodeAttributeCategories',
      'cwe',
      'f',
      'facets',
      'impactSeverities',
      'impactSoftwareQualities',
      'inheritance',
      'languages',
      'owaspTop10',
      'repositories',
      'rule_keys',
      'severities',
      'sonarsourceSecurity',
      'statuses',
      'tags',
      'types',
    ];

    // Add parameters to search params
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (arrayParams.includes(key as keyof SearchRulesRequest) && Array.isArray(value)) {
          if (value.length > 0) {
            searchParams.append(key, value.join(','));
          }
        } else if (typeof value === 'boolean') {
          searchParams.append(key, value.toString());
        } else if (typeof value === 'number' || typeof value === 'string') {
          searchParams.append(key, value.toString());
        }
      }
    }

    return this.request<SearchRulesResponse>(`/api/rules/search?${searchParams.toString()}`);
  }
}
