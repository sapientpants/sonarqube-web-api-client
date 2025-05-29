import { BaseClient } from '../../core/BaseClient';
import type {
  AiCodeAssuranceBadgeParams,
  MeasureBadgeParams,
  QualityGateBadgeParams,
} from './types';

/**
 * Client for interacting with SonarQube project badges endpoints
 * Generate badges based on quality gates or measures
 */
export class ProjectBadgesClient extends BaseClient {
  /**
   * Generate a badge for project's AI assurance as an SVG
   * Requires 'Browse' permission on the specified project
   * @param params - Badge parameters (token can be used for private projects)
   * @returns SVG badge content
   *
   * @example
   * ```typescript
   * const client = new ProjectBadgesClient(baseUrl, token);
   * const svg = await client.aiCodeAssurance({ project: 'my_project' });
   * ```
   */
  async aiCodeAssurance(params: AiCodeAssuranceBadgeParams): Promise<string> {
    const query = this.buildBadgeQuery({
      project: params.project,
      token: params.token,
    });
    return await this.request<string>(`/api/project_badges/ai_code_assurance?${query}`, {
      headers: {
        ['Accept']: 'image/svg+xml',
      },
      responseType: 'text',
    });
  }

  /**
   * Generate badge for project's measure as an SVG
   * Requires a security token for private projects
   * @param params - Badge parameters
   * @returns SVG badge content
   *
   * @example
   * ```typescript
   * const client = new ProjectBadgesClient(baseUrl, token);
   * const svg = await client.measure({
   *   project: 'my_project',
   *   metric: 'coverage',
   *   branch: 'develop'
   * });
   * ```
   */
  async measure(params: MeasureBadgeParams): Promise<string> {
    const query = this.buildBadgeQuery({
      project: params.project,
      metric: params.metric,
      branch: params.branch,
      token: params.token,
    });
    return await this.request<string>(`/api/project_badges/measure?${query}`, {
      headers: {
        ['Accept']: 'image/svg+xml',
      },
      responseType: 'text',
    });
  }

  /**
   * Generate badge for project's quality gate as an SVG
   * Requires a security token for private projects
   * @param params - Badge parameters
   * @returns SVG badge content
   *
   * @example
   * ```typescript
   * const client = new ProjectBadgesClient(baseUrl, token);
   * const svg = await client.qualityGate({
   *   project: 'my_project',
   *   branch: 'main'
   * });
   * ```
   */
  async qualityGate(params: QualityGateBadgeParams): Promise<string> {
    const query = this.buildBadgeQuery({
      project: params.project,
      branch: params.branch,
      token: params.token,
    });
    return await this.request<string>(`/api/project_badges/quality_gate?${query}`, {
      headers: {
        ['Accept']: 'image/svg+xml',
      },
      responseType: 'text',
    });
  }

  /**
   * Helper method to build query parameters for badge requests
   * @param params - Badge parameters
   * @returns URL search params string
   */
  private buildBadgeQuery(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    }

    return searchParams.toString();
  }
}
