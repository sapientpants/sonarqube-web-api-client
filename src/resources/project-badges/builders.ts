import { BaseBuilder, ParameterHelpers } from '../../core/builders/index.js';
import type { QualityGateBadgeParams, MeasureBadgeParams } from './types.js';

/**
 * Builder for generating quality gate badges.
 */
export class QualityGateBadgeBuilder extends BaseBuilder<QualityGateBadgeParams, string> {
  /**
   * Set the project key.
   */
  withProject = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the project key (alias for withProject).
   */
  project = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the branch name.
   */
  withBranch = ParameterHelpers.createStringMethod<typeof this>('branch');

  /**
   * Set the branch name (alias for withBranch).
   */
  branch = ParameterHelpers.createStringMethod<typeof this>('branch');

  /**
   * Set the security token.
   */
  withToken = ParameterHelpers.createStringMethod<typeof this>('token');

  /**
   * Set the security token (alias for withToken).
   */
  token = ParameterHelpers.createStringMethod<typeof this>('token');

  /**
   * Set the badge template.
   */
  withTemplate = ParameterHelpers.createStringMethod<typeof this>('template');

  /**
   * Set the badge template (alias for withTemplate).
   */
  template = ParameterHelpers.createStringMethod<typeof this>('template');

  async execute(): Promise<string> {
    const finalParams = this.params as QualityGateBadgeParams;
    return this.executor(finalParams);
  }

  protected getEndpoint(): string {
    return '/api/project_badges/quality_gate';
  }
}

/**
 * Builder for generating measure badges.
 */
export class MeasureBadgeBuilder extends BaseBuilder<MeasureBadgeParams, string> {
  /**
   * Set the project key.
   */
  withProject = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the project key (alias for withProject).
   */
  project = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Set the metric key.
   */
  withMetric = ParameterHelpers.createStringMethod<typeof this>('metric');

  /**
   * Set the metric key (alias for withMetric).
   */
  metric = ParameterHelpers.createStringMethod<typeof this>('metric');

  /**
   * Set the branch name.
   */
  withBranch = ParameterHelpers.createStringMethod<typeof this>('branch');

  /**
   * Set the branch name (alias for withBranch).
   */
  branch = ParameterHelpers.createStringMethod<typeof this>('branch');

  /**
   * Set the security token.
   */
  withToken = ParameterHelpers.createStringMethod<typeof this>('token');

  /**
   * Set the security token (alias for withToken).
   */
  token = ParameterHelpers.createStringMethod<typeof this>('token');

  async execute(): Promise<string> {
    const finalParams = this.params as MeasureBadgeParams;
    return this.executor(finalParams);
  }

  protected getEndpoint(): string {
    return '/api/project_badges/measure';
  }
}
