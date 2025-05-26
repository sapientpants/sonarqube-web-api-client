import {
  AlmSettingsBuilderWithOAuth,
  ProjectBindingBuilder,
  validateRequired,
  validateOAuth,
} from '../../core/builders';
import type {
  CreateGitHubRequest,
  UpdateGitHubRequest,
  CreateBitbucketCloudRequest,
  UpdateBitbucketCloudRequest,
  SetAzureBindingRequest,
  SetBitbucketBindingRequest,
  SetBitbucketCloudBindingRequest,
  SetGitHubBindingRequest,
  SetGitLabBindingRequest,
} from './types';

/**
 * Base builder for GitHub ALM settings operations
 */
abstract class BaseGitHubBuilder<
  TRequest extends { clientId?: string; clientSecret?: string },
> extends AlmSettingsBuilderWithOAuth<TRequest> {
  constructor(executor: (params: TRequest) => Promise<void>, key: string) {
    super(executor);
    this.setParam('key' as keyof TRequest, key as TRequest[keyof TRequest]);
  }

  /**
   * Set the GitHub App ID
   */
  withAppId(appId: string): this {
    return this.setParam('appId' as keyof TRequest, appId as TRequest[keyof TRequest]);
  }

  /**
   * Set the private key
   */
  withPrivateKey(privateKey: string): this {
    return this.setParam('privateKey' as keyof TRequest, privateKey as TRequest[keyof TRequest]);
  }

  /**
   * Set the GitHub URL (for GitHub Enterprise)
   */
  withUrl(url: string): this {
    return this.setParam('url' as keyof TRequest, url as TRequest[keyof TRequest]);
  }

  /**
   * Set the webhook secret
   */
  withWebhookSecret(webhookSecret: string): this {
    return this.setParam(
      'webhookSecret' as keyof TRequest,
      webhookSecret as TRequest[keyof TRequest]
    );
  }
}

/**
 * Builder for creating GitHub ALM settings
 */
export class CreateGitHubBuilder extends BaseGitHubBuilder<CreateGitHubRequest> {
  async execute(): Promise<void> {
    validateRequired(this.params.appId, 'GitHub App ID');
    validateOAuth(this.params.clientId, this.params.clientSecret, 'OAuth');
    validateRequired(this.params.privateKey, 'Private key');
    validateRequired(this.params.url, 'URL');

    return this.executor(this.params as CreateGitHubRequest);
  }
}

/**
 * Builder for updating GitHub ALM settings
 */
export class UpdateGitHubBuilder extends BaseGitHubBuilder<UpdateGitHubRequest> {
  /**
   * Set a new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    return this.setParam('newKey', newKey);
  }

  async execute(): Promise<void> {
    return this.executor(this.params as UpdateGitHubRequest);
  }
}

/**
 * Base builder for Bitbucket Cloud ALM settings operations
 */
abstract class BaseBitbucketCloudBuilder<
  TRequest extends { clientId?: string; clientSecret?: string },
> extends AlmSettingsBuilderWithOAuth<TRequest> {
  constructor(executor: (params: TRequest) => Promise<void>, key: string) {
    super(executor);
    this.setParam('key' as keyof TRequest, key as TRequest[keyof TRequest]);
  }

  /**
   * Set the workspace ID
   */
  withWorkspace(workspace: string): this {
    return this.setParam('workspace' as keyof TRequest, workspace as TRequest[keyof TRequest]);
  }
}

/**
 * Builder for creating Bitbucket Cloud ALM settings
 */
export class CreateBitbucketCloudBuilder extends BaseBitbucketCloudBuilder<CreateBitbucketCloudRequest> {
  async execute(): Promise<void> {
    validateRequired(this.params.workspace, 'Workspace ID');
    validateOAuth(this.params.clientId, this.params.clientSecret, 'OAuth');

    return this.executor(this.params as CreateBitbucketCloudRequest);
  }
}

/**
 * Builder for updating Bitbucket Cloud ALM settings
 */
export class UpdateBitbucketCloudBuilder extends BaseBitbucketCloudBuilder<UpdateBitbucketCloudRequest> {
  /**
   * Set a new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    return this.setParam('newKey', newKey);
  }

  async execute(): Promise<void> {
    return this.executor(this.params as UpdateBitbucketCloudRequest);
  }
}

/**
 * Builder for setting Azure DevOps project binding
 */
export class SetAzureBindingBuilder extends ProjectBindingBuilder<SetAzureBindingRequest> {
  /**
   * Whether the project is a monorepo (defaults to false)
   */
  asMonorepo(monorepo = true): this {
    return this.setParam('monorepo', monorepo);
  }

  /**
   * Set the Azure project name
   */
  withAzureProjectName(projectName: string): this {
    return this.setParam('projectName', projectName);
  }

  /**
   * Set the repository name
   */
  withRepositoryName(repositoryName: string): this {
    return this.setParam('repositoryName', repositoryName);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.projectName, 'Azure project name');
    validateRequired(this.params.repositoryName, 'Repository name');

    return this.executor(this.params as SetAzureBindingRequest);
  }
}

/**
 * Builder for setting Bitbucket Server project binding
 */
export class SetBitbucketBindingBuilder extends ProjectBindingBuilder<SetBitbucketBindingRequest> {
  /**
   * Whether the project is a monorepo (defaults to false)
   */
  asMonorepo(monorepo = true): this {
    return this.setParam('monorepo', monorepo);
  }

  /**
   * Set the Bitbucket project key
   */
  withRepository(repository: string): this {
    return this.setParam('repository', repository);
  }

  /**
   * Set the repository slug
   */
  withRepositorySlug(slug: string): this {
    return this.setParam('slug', slug);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.repository, 'Bitbucket repository');
    validateRequired(this.params.slug, 'Repository slug');

    return this.executor(this.params as SetBitbucketBindingRequest);
  }
}

/**
 * Builder for setting Bitbucket Cloud project binding
 */
export class SetBitbucketCloudBindingBuilder extends ProjectBindingBuilder<SetBitbucketCloudBindingRequest> {
  /**
   * Whether the project is a monorepo (defaults to false)
   */
  asMonorepo(monorepo = true): this {
    return this.setParam('monorepo', monorepo);
  }

  /**
   * Set the repository slug
   */
  withRepository(repository: string): this {
    return this.setParam('repository', repository);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.repository, 'Repository');

    return this.executor(this.params as SetBitbucketCloudBindingRequest);
  }
}

/**
 * Builder for setting GitHub project binding
 */
export class SetGitHubBindingBuilder extends ProjectBindingBuilder<SetGitHubBindingRequest> {
  /**
   * Whether the project is a monorepo (defaults to false)
   */
  asMonorepo(monorepo = true): this {
    return this.setParam('monorepo', monorepo);
  }

  /**
   * Set the repository key
   */
  withRepository(repository: string): this {
    return this.setParam('repository', repository);
  }

  /**
   * Whether to display summary comments on pull requests (defaults to false)
   */
  withSummaryComments(summaryCommentEnabled = true): this {
    return this.setParam('summaryCommentEnabled', summaryCommentEnabled);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.repository, 'Repository');

    return this.executor(this.params as SetGitHubBindingRequest);
  }
}

/**
 * Builder for setting GitLab project binding
 */
export class SetGitLabBindingBuilder extends ProjectBindingBuilder<SetGitLabBindingRequest> {
  /**
   * Whether the project is a monorepo (defaults to false)
   */
  asMonorepo(monorepo = true): this {
    return this.setParam('monorepo', monorepo);
  }

  /**
   * Set the repository key
   */
  withRepository(repository: string): this {
    return this.setParam('repository', repository);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.repository, 'Repository');

    return this.executor(this.params as SetGitLabBindingRequest);
  }
}
