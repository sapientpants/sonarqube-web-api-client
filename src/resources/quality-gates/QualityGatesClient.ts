import { BaseClient } from '../../core/BaseClient';
import type {
  QualityGate,
  CreateQualityGateRequest,
  UpdateQualityGateRequest,
  DeleteQualityGateRequest,
  SetAsDefaultRequest,
  CopyQualityGateRequest,
  RenameQualityGateRequest,
  GetQualityGateRequest,
  ListQualityGatesResponse,
  SetConditionRequest,
  UpdateConditionRequest,
  DeleteConditionRequest,
  GetProjectsRequest,
  GetProjectsResponse,
  AssociateProjectsRequest,
  DissociateProjectsRequest,
  ProjectQualityGateStatus,
  GetProjectStatusRequest,
} from './types';
import { SetConditionBuilder, GetProjectsBuilder, AssociateProjectsBuilder } from './builders';

/**
 * Client for managing Quality Gates
 */
export class QualityGatesClient extends BaseClient {
  /**
   * Get a quality gate by ID
   * Requires 'Browse' permission on the specified quality gate
   * @since 4.3
   */
  async get(params: GetQualityGateRequest): Promise<QualityGate> {
    const query = new URLSearchParams({
      id: params.id,
    });
    return this.request(`/api/qualitygates/show?${query.toString()}`);
  }

  /**
   * List all quality gates
   * @since 4.3
   */
  async list(): Promise<ListQualityGatesResponse> {
    return this.request('/api/qualitygates/list');
  }

  /**
   * Create a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async create(params: CreateQualityGateRequest): Promise<QualityGate> {
    return this.request('/api/qualitygates/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Update a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async update(params: UpdateQualityGateRequest): Promise<void> {
    await this.request('/api/qualitygates/rename', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async delete(params: DeleteQualityGateRequest): Promise<void> {
    await this.request('/api/qualitygates/destroy', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Set a quality gate as the default one
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async setAsDefault(params: SetAsDefaultRequest): Promise<void> {
    await this.request('/api/qualitygates/set_as_default', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Copy a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async copy(params: CopyQualityGateRequest): Promise<QualityGate> {
    return this.request('/api/qualitygates/copy', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Rename a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async rename(params: RenameQualityGateRequest): Promise<void> {
    await this.request('/api/qualitygates/rename', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Add a condition to a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async setCondition(params: SetConditionRequest): Promise<void> {
    await this.request('/api/qualitygates/create_condition', {
      method: 'POST',
      body: JSON.stringify({
        gateId: params.gateId,
        metric: params.metric,
        op: params.operator,
        error: params.error,
        warning: params.warning,
      }),
    });
  }

  /**
   * Update a condition on a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async updateCondition(params: UpdateConditionRequest): Promise<void> {
    await this.request('/api/qualitygates/update_condition', {
      method: 'POST',
      body: JSON.stringify({
        id: params.id,
        metric: params.metric,
        op: params.operator,
        error: params.error,
        warning: params.warning,
      }),
    });
  }

  /**
   * Delete a condition from a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async deleteCondition(params: DeleteConditionRequest): Promise<void> {
    await this.request('/api/qualitygates/delete_condition', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get projects associated with a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async getProjects(params: GetProjectsRequest): Promise<GetProjectsResponse> {
    const query = new URLSearchParams({
      gateId: params.gateId.toString(),
    });
    if (params.p !== undefined) {
      query.append('p', params.p.toString());
    }
    if (params.ps !== undefined) {
      query.append('ps', params.ps.toString());
    }
    if (params.query !== undefined) {
      query.append('query', params.query);
    }
    if (params.selected !== undefined) {
      query.append('selected', params.selected);
    }
    return this.request(`/api/qualitygates/search?${query.toString()}`);
  }

  /**
   * Associate projects with a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async associateProjects(params: AssociateProjectsRequest): Promise<void> {
    await this.request('/api/qualitygates/select', {
      method: 'POST',
      body: JSON.stringify({
        gateId: params.gateId,
        projectKey: params.projectKeys.join(','),
      }),
    });
  }

  /**
   * Dissociate projects from a quality gate
   * Requires 'Administer Quality Gates' permission
   * @since 4.3
   */
  async dissociateProjects(params: DissociateProjectsRequest): Promise<void> {
    await this.request('/api/qualitygates/deselect', {
      method: 'POST',
      body: JSON.stringify({
        gateId: params.gateId,
        projectKey: params.projectKeys.join(','),
      }),
    });
  }

  /**
   * Get quality gate status for a project
   * Requires 'Browse' permission on the project
   * @since 5.3
   */
  async getProjectStatus(params: GetProjectStatusRequest): Promise<ProjectQualityGateStatus> {
    const query = new URLSearchParams();
    if (params.projectKey !== undefined) {
      query.append('projectKey', params.projectKey);
    }
    if (params.projectId !== undefined) {
      query.append('projectId', params.projectId);
    }
    if (params.analysisId !== undefined) {
      query.append('analysisId', params.analysisId);
    }
    if (params.branch !== undefined) {
      query.append('branch', params.branch);
    }
    if (params.pullRequest !== undefined) {
      query.append('pullRequest', params.pullRequest);
    }
    return this.request(`/api/qualitygates/project_status?${query.toString()}`);
  }

  // Builder methods

  /**
   * Create a builder for setting conditions on a quality gate
   * @param gateId The quality gate ID
   * @returns A builder for setting conditions
   */
  setConditionBuilder(gateId: string): SetConditionBuilder {
    return new SetConditionBuilder(async (params) => this.setCondition(params), gateId);
  }

  /**
   * Create a builder for getting projects associated with a quality gate
   * @param gateId The quality gate ID
   * @returns A builder for getting projects
   */
  getProjectsBuilder(gateId: string): GetProjectsBuilder {
    return new GetProjectsBuilder(async (params) => this.getProjects(params), gateId);
  }

  /**
   * Create a builder for associating projects with a quality gate
   * @param gateId The quality gate ID
   * @returns A builder for associating projects
   */
  associateProjectsBuilder(gateId: string): AssociateProjectsBuilder {
    return new AssociateProjectsBuilder(async (params) => this.associateProjects(params), gateId);
  }
}
