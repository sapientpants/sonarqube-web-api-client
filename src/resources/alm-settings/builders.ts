import { BaseBuilder, isRequired, validateRequired, validateOAuth } from '../../core/builders';
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
 * Builder for creating GitHub ALM settings
 */
export class CreateGitHubBuilder extends BaseBuilder<CreateGitHubRequest> {
  constructor(executor: (params: CreateGitHubRequest) => Promise<void>, key: string) {
    super(executor);
    this.setParam('key', key);
  }

  /**
   * Set the GitHub App ID
   */
  withAppId(appId: string): this {
    return this.setParam('appId', appId);
  }

  /**
   * Set the OAuth client ID and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    return this.setParams({ clientId, clientSecret });
  }

  /**
   * Set the private key
   */
  withPrivateKey(privateKey: string): this {
    return this.setParam('privateKey', privateKey);
  }

  /**
   * Set the GitHub URL (for GitHub Enterprise)
   */
  withUrl(url: string): this {
    return this.setParam('url', url);
  }

  /**
   * Set the webhook secret
   */
  withWebhookSecret(webhookSecret: string): this {
    return this.setParam('webhookSecret', webhookSecret);
  }

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
export class UpdateGitHubBuilder extends BaseBuilder<UpdateGitHubRequest> {
  constructor(executor: (params: UpdateGitHubRequest) => Promise<void>, key: string) {
    super(executor);
    this.setParam('key', key);
  }

  /**
   * Set a new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    return this.setParam('newKey', newKey);
  }

  /**
   * Update the GitHub App ID
   */
  withAppId(appId: string): this {
    return this.setParam('appId', appId);
  }

  /**
   * Update the OAuth client ID and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    return this.setParams({ clientId, clientSecret });
  }

  /**
   * Update the private key
   */
  withPrivateKey(privateKey: string): this {
    return this.setParam('privateKey', privateKey);
  }

  /**
   * Update the GitHub URL
   */
  withUrl(url: string): this {
    return this.setParam('url', url);
  }

  /**
   * Update the webhook secret
   */
  withWebhookSecret(webhookSecret: string): this {
    return this.setParam('webhookSecret', webhookSecret);
  }

  async execute(): Promise<void> {
    return this.executor(this.params as UpdateGitHubRequest);
  }
}

/**
 * Builder for creating Bitbucket Cloud ALM settings
 */
export class CreateBitbucketCloudBuilder extends BaseBuilder<CreateBitbucketCloudRequest> {
  constructor(executor: (params: CreateBitbucketCloudRequest) => Promise<void>, key: string) {
    super(executor);
    this.setParam('key', key);
  }

  /**
   * Set the OAuth consumer key (client ID) and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    return this.setParams({ clientId, clientSecret });
  }

  /**
   * Set the Bitbucket workspace ID
   */
  withWorkspace(workspace: string): this {
    return this.setParam('workspace', workspace);
  }

  async execute(): Promise<void> {
    if (!isRequired(this.params.clientId) || !isRequired(this.params.clientSecret)) {
      throw new Error('OAuth consumer key and secret are required');
    }
    validateRequired(this.params.workspace, 'Workspace');

    return this.executor(this.params as CreateBitbucketCloudRequest);
  }
}

/**
 * Builder for updating Bitbucket Cloud ALM settings
 */
export class UpdateBitbucketCloudBuilder extends BaseBuilder<UpdateBitbucketCloudRequest> {
  constructor(executor: (params: UpdateBitbucketCloudRequest) => Promise<void>, key: string) {
    super(executor);
    this.setParam('key', key);
  }

  /**
   * Set a new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    return this.setParam('newKey', newKey);
  }

  /**
   * Update the OAuth consumer key (client ID) and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    return this.setParams({ clientId, clientSecret });
  }

  /**
   * Update the Bitbucket workspace ID
   */
  withWorkspace(workspace: string): this {
    return this.setParam('workspace', workspace);
  }

  async execute(): Promise<void> {
    return this.executor(this.params as UpdateBitbucketCloudRequest);
  }
}

/**
 * Base builder for project binding operations
 */
abstract class BaseBindingBuilder<TRequest> extends BaseBuilder<TRequest> {
  constructor(executor: (params: TRequest) => Promise<void>, project: string, almSetting: string) {
    super(executor);
    // Type assertion is safe here as all binding requests have project and almSetting fields
    this.setParams({ project, almSetting } as unknown as Partial<TRequest>);
  }

  /**
   * Mark this as a monorepo binding
   */
  asMonorepo(): this {
    return this.setParam('monorepo' as keyof TRequest, true as TRequest[keyof TRequest]);
  }
}

/**
 * Builder for setting Azure DevOps bindings
 */
export class SetAzureBindingBuilder extends BaseBindingBuilder<SetAzureBindingRequest> {
  /**
   * Set the Azure project name
   */
  withProjectName(projectName: string): this {
    return this.setParam('projectName', projectName);
  }

  /**
   * Set the Azure repository name
   */
  withRepository(repositoryName: string): this {
    return this.setParam('repositoryName', repositoryName);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.projectName, 'Azure project name');
    validateRequired(this.params.repositoryName, 'Repository name');

    return this.executor(this.params as SetAzureBindingRequest);
  }
}

/**
 * Builder for setting Bitbucket Server bindings
 */
export class SetBitbucketBindingBuilder extends BaseBindingBuilder<SetBitbucketBindingRequest> {
  /**
   * Set the Bitbucket repository
   */
  withRepository(repository: string): this {
    return this.setParam('repository', repository);
  }

  /**
   * Set the repository slug
   */
  withSlug(slug: string): this {
    return this.setParam('slug', slug);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.repository, 'Repository');
    validateRequired(this.params.slug, 'Repository slug');

    return this.executor(this.params as SetBitbucketBindingRequest);
  }
}

/**
 * Builder for setting Bitbucket Cloud bindings
 */
export class SetBitbucketCloudBindingBuilder extends BaseBindingBuilder<SetBitbucketCloudBindingRequest> {
  /**
   * Set the Bitbucket repository
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
 * Builder for setting GitHub bindings
 */
export class SetGitHubBindingBuilder extends BaseBindingBuilder<SetGitHubBindingRequest> {
  /**
   * Set the GitHub repository
   */
  withRepository(repository: string): this {
    return this.setParam('repository', repository);
  }

  /**
   * Enable summary comments on pull requests
   */
  withSummaryComments(enabled = true): this {
    return this.setParam('summaryCommentEnabled', enabled);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.repository, 'Repository');

    return this.executor(this.params as SetGitHubBindingRequest);
  }
}

/**
 * Builder for setting GitLab bindings
 */
export class SetGitLabBindingBuilder extends BaseBindingBuilder<SetGitLabBindingRequest> {
  /**
   * Set the GitLab repository
   */
  withRepository(repository: string): this {
    return this.setParam('repository', repository);
  }

  async execute(): Promise<void> {
    validateRequired(this.params.repository, 'Repository');

    return this.executor(this.params as SetGitLabBindingRequest);
  }
}
