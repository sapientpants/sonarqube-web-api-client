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
 * Base builder for ALM settings with key initialization
 */
export abstract class AlmSettingsBuilderWithKey<
  TRequest extends { clientId?: string; clientSecret?: string; key?: string },
> extends AlmSettingsBuilderWithOAuth<TRequest> {
  constructor(executor: (params: TRequest) => Promise<void>, key: string) {
    super(executor);
    this.setParam('key' as keyof TRequest, key as TRequest[keyof TRequest]);
  }
}

/**
 * Base builder for updatable ALM settings operations
 */
export abstract class UpdatableAlmSettingsBuilder<
  TRequest extends { clientId?: string; clientSecret?: string; newKey?: string },
> extends AlmSettingsBuilderWithOAuth<TRequest> {
  /**
   * Set a new key for the ALM setting
   * @param newKey - The new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    return this.setParam('newKey' as keyof TRequest, newKey as TRequest[keyof TRequest]);
  }
}

/**
 * Base builder for updatable ALM settings operations with key initialization
 */
export abstract class UpdatableAlmSettingsBuilderWithKey<
  TRequest extends { clientId?: string; clientSecret?: string; key?: string; newKey?: string },
> extends AlmSettingsBuilderWithKey<TRequest> {
  /**
   * Set a new key for the ALM setting
   * @param newKey - The new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    return this.setParam('newKey' as keyof TRequest, newKey as TRequest[keyof TRequest]);
  }
}

/**
 * Base builder for project binding operations
 */
export abstract class ProjectBindingBuilder<
  TRequest extends {
    project?: string;
    almSetting?: string;
    monorepo?: boolean;
    repository?: string;
  },
> extends BaseBuilder<TRequest> {
  constructor(executor: (params: TRequest) => Promise<void>, project: string, almSetting: string) {
    super(executor);
    this.setParam('project' as keyof TRequest, project as TRequest[keyof TRequest]);
    this.setParam('almSetting' as keyof TRequest, almSetting as TRequest[keyof TRequest]);
  }

  /**
   * Enable monorepo analysis for this project binding
   * @param monorepo - Whether to enable monorepo analysis (default: true)
   */
  asMonorepo(monorepo = true): this {
    return this.setParam('monorepo' as keyof TRequest, monorepo as TRequest[keyof TRequest]);
  }

  /**
   * Set the repository identifier
   * @param repository - The repository identifier
   */
  withRepository(repository: string): this {
    return this.setParam('repository' as keyof TRequest, repository as TRequest[keyof TRequest]);
  }
}
