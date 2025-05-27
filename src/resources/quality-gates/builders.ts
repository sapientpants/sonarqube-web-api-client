import { BaseBuilder, PaginatedBuilder, validateRequired } from '../../core/builders';
import type {
  SetConditionRequest,
  GetProjectsRequest,
  GetProjectsResponse,
  AssociateProjectsRequest,
  QualityGateOperator,
  QualityGateProject,
} from './types';

/**
 * Builder for setting conditions on a quality gate
 */
export class SetConditionBuilder extends BaseBuilder<SetConditionRequest> {
  constructor(executor: (params: SetConditionRequest) => Promise<void>, gateId: string) {
    super(executor);
    this.setParam('gateId', gateId);
  }

  /**
   * Set the metric for the condition
   */
  withMetric(metric: string): this {
    return this.setParam('metric', metric);
  }

  /**
   * Set the operator for the condition
   */
  withOperator(operator: QualityGateOperator): this {
    return this.setParam('operator', operator);
  }

  /**
   * Set the error threshold
   */
  withErrorThreshold(error: string): this {
    return this.setParam('error', error);
  }

  /**
   * Set the warning threshold
   */
  withWarningThreshold(warning: string): this {
    return this.setParam('warning', warning);
  }

  /**
   * Configure condition for coverage metric
   */
  forCoverage(): this {
    return this.withMetric('coverage');
  }

  /**
   * Configure condition for duplicated lines density
   */
  forDuplicatedLinesDensity(): this {
    return this.withMetric('duplicated_lines_density');
  }

  /**
   * Configure condition for maintainability rating
   */
  forMaintainabilityRating(): this {
    return this.withMetric('sqale_rating');
  }

  /**
   * Configure condition for reliability rating
   */
  forReliabilityRating(): this {
    return this.withMetric('reliability_rating');
  }

  /**
   * Configure condition for security rating
   */
  forSecurityRating(): this {
    return this.withMetric('security_rating');
  }

  /**
   * Configure condition for security hotspots reviewed
   */
  forSecurityHotspotsReviewed(): this {
    return this.withMetric('security_hotspots_reviewed');
  }

  /**
   * Set operator to "less than"
   */
  lessThan(): this {
    return this.withOperator('LT');
  }

  /**
   * Set operator to "greater than"
   */
  greaterThan(): this {
    return this.withOperator('GT');
  }

  /**
   * Set operator to "equals"
   */
  equals(): this {
    return this.withOperator('EQ');
  }

  /**
   * Set operator to "not equals"
   */
  notEquals(): this {
    return this.withOperator('NE');
  }

  async execute(): Promise<void> {
    validateRequired(this.params.metric, 'Metric');
    validateRequired(this.params.operator, 'Operator');

    if (
      (this.params.error === undefined || this.params.error === '') &&
      (this.params.warning === undefined || this.params.warning === '')
    ) {
      throw new Error('At least one threshold (error or warning) must be specified');
    }

    return this.executor(this.params as SetConditionRequest);
  }
}

/**
 * Builder for getting projects associated with a quality gate
 */
export class GetProjectsBuilder extends PaginatedBuilder<
  GetProjectsRequest,
  GetProjectsResponse,
  QualityGateProject
> {
  constructor(
    executor: (params: GetProjectsRequest) => Promise<GetProjectsResponse>,
    gateId: string
  ) {
    super(executor);
    this.setParam(
      'gateId' as keyof GetProjectsRequest,
      gateId as GetProjectsRequest[keyof GetProjectsRequest]
    );
  }

  /**
   * Filter projects by name or key
   */
  withQuery(query: string): this {
    return this.setParam(
      'query' as keyof GetProjectsRequest,
      query as GetProjectsRequest[keyof GetProjectsRequest]
    );
  }

  /**
   * Filter by project selection status
   */
  withSelection(selected: 'all' | 'selected' | 'deselected'): this {
    return this.setParam(
      'selected' as keyof GetProjectsRequest,
      selected as GetProjectsRequest[keyof GetProjectsRequest]
    );
  }

  /**
   * Show only selected projects
   */
  onlySelected(): this {
    return this.withSelection('selected');
  }

  /**
   * Show only deselected projects
   */
  onlyDeselected(): this {
    return this.withSelection('deselected');
  }

  /**
   * Show all projects (selected and deselected)
   */
  showAll(): this {
    return this.withSelection('all');
  }

  async execute(): Promise<GetProjectsResponse> {
    return this.executor(this.params as GetProjectsRequest);
  }

  /**
   * Get the items from the response
   */
  protected getItems(response: GetProjectsResponse): QualityGateProject[] {
    return response.results;
  }
}

/**
 * Builder for associating projects with a quality gate
 */
export class AssociateProjectsBuilder extends BaseBuilder<AssociateProjectsRequest> {
  constructor(executor: (params: AssociateProjectsRequest) => Promise<void>, gateId: string) {
    super(executor);
    this.setParam('gateId', gateId);
    this.setParam('projectKeys', []);
  }

  /**
   * Add a project key to associate
   */
  withProject(projectKey: string): this {
    const currentKeys = this.params.projectKeys ?? [];
    return this.setParam('projectKeys', [...currentKeys, projectKey]);
  }

  /**
   * Add multiple project keys to associate
   */
  withProjects(projectKeys: string[]): this {
    const currentKeys = this.params.projectKeys ?? [];
    return this.setParam('projectKeys', [...currentKeys, ...projectKeys]);
  }

  /**
   * Clear all project keys
   */
  clearProjects(): this {
    return this.setParam('projectKeys', []);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.projectKeys, 'Project keys');

    if (!this.params.projectKeys || this.params.projectKeys.length === 0) {
      throw new Error('At least one project key must be specified');
    }

    return this.executor(this.params as AssociateProjectsRequest);
  }
}
