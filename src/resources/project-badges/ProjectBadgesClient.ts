import { BaseClient } from '../../core/BaseClient';
import type {
  AiCodeAssuranceBadgeParams,
  MeasureBadgeParams,
  QualityGateBadgeParams,
  BadgeResponse,
} from './types';

/**
 * Client for interacting with SonarQube project badges endpoints
 * Generate badges based on quality gates or measures
 */
export class ProjectBadgesClient extends BaseClient {
  /**
   * Generate a badge for project's AI assurance as an SVG
   * Requires 'Browse' permission on the specified project
   * @param params - Badge parameters
   * @returns SVG badge content
   *
   * @example
   * ```typescript
   * const client = new ProjectBadgesClient(baseUrl, token);
   * const svg = await client.aiCodeAssurance({ project: 'my_project' });
   * ```
   */
  async aiCodeAssurance(params: AiCodeAssuranceBadgeParams): Promise<BadgeResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('project', params.project);

    if (params.token !== undefined) {
      searchParams.append('token', params.token);
    }

    const query = searchParams.toString();
    return await this.request<BadgeResponse>(`/api/project_badges/ai_code_assurance?${query}`, {
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
  async measure(params: MeasureBadgeParams): Promise<BadgeResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('project', params.project);
    searchParams.append('metric', params.metric);

    if (params.branch !== undefined) {
      searchParams.append('branch', params.branch);
    }
    if (params.token !== undefined) {
      searchParams.append('token', params.token);
    }

    const query = searchParams.toString();
    return await this.request<BadgeResponse>(`/api/project_badges/measure?${query}`, {
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
  async qualityGate(params: QualityGateBadgeParams): Promise<BadgeResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('project', params.project);

    if (params.branch !== undefined) {
      searchParams.append('branch', params.branch);
    }
    if (params.token !== undefined) {
      searchParams.append('token', params.token);
    }

    const query = searchParams.toString();
    return await this.request<BadgeResponse>(`/api/project_badges/quality_gate?${query}`, {
      headers: {
        ['Accept']: 'image/svg+xml',
      },
      responseType: 'text',
    });
  }
}
