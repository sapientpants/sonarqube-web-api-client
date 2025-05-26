import { BaseBuilder } from './BaseBuilder';

/**
 * Base builder for ALM settings operations with OAuth capabilities
 */
export abstract class AlmSettingsBuilderWithOAuth<
  TRequest extends { clientId?: string; clientSecret?: string },
> extends BaseBuilder<TRequest> {
  /**
   * Set OAuth credentials
   * @param clientId - OAuth client ID
   * @param clientSecret - OAuth client secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    return this.setParams({ clientId, clientSecret } as Partial<TRequest>);
  }
}

/**
 * Base builder for project binding operations
 */
export abstract class ProjectBindingBuilder<
  TRequest extends { project?: string; almSetting?: string },
> extends BaseBuilder<TRequest> {
  constructor(executor: (params: TRequest) => Promise<void>, project: string, almSetting: string) {
    super(executor);
    this.setParam('project' as keyof TRequest, project as TRequest[keyof TRequest]);
    this.setParam('almSetting' as keyof TRequest, almSetting as TRequest[keyof TRequest]);
  }
}
