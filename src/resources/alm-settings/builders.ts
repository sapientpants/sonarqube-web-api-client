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
 * Base builder for ALM settings operations
 */
abstract class BaseAlmBuilder<TRequest> {
  protected params: Partial<TRequest> = {};

  constructor(protected executor: (params: TRequest) => Promise<void>) {}

  /**
   * Execute the operation
   */
  abstract execute(): Promise<void>;
}

/**
 * Builder for creating GitHub ALM settings
 */
export class CreateGitHubBuilder extends BaseAlmBuilder<CreateGitHubRequest> {
  constructor(executor: (params: CreateGitHubRequest) => Promise<void>, key: string) {
    super(executor);
    this.params.key = key;
  }

  /**
   * Set the GitHub App ID
   */
  withAppId(appId: string): this {
    this.params.appId = appId;
    return this;
  }

  /**
   * Set the OAuth client ID and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    this.params.clientId = clientId;
    this.params.clientSecret = clientSecret;
    return this;
  }

  /**
   * Set the private key
   */
  withPrivateKey(privateKey: string): this {
    this.params.privateKey = privateKey;
    return this;
  }

  /**
   * Set the GitHub URL (for GitHub Enterprise)
   */
  withUrl(url: string): this {
    this.params.url = url;
    return this;
  }

  /**
   * Set the webhook secret
   */
  withWebhookSecret(webhookSecret: string): this {
    this.params.webhookSecret = webhookSecret;
    return this;
  }

  async execute(): Promise<void> {
    if (this.params.appId === undefined || this.params.appId === '') {
      throw new Error('GitHub App ID is required');
    }
    if (
      this.params.clientId === undefined ||
      this.params.clientId === '' ||
      this.params.clientSecret === undefined ||
      this.params.clientSecret === ''
    ) {
      throw new Error('OAuth client ID and secret are required');
    }
    if (this.params.privateKey === undefined || this.params.privateKey === '') {
      throw new Error('Private key is required');
    }
    if (this.params.url === undefined || this.params.url === '') {
      throw new Error('URL is required');
    }

    return this.executor(this.params as CreateGitHubRequest);
  }
}

/**
 * Builder for updating GitHub ALM settings
 */
export class UpdateGitHubBuilder extends BaseAlmBuilder<UpdateGitHubRequest> {
  constructor(executor: (params: UpdateGitHubRequest) => Promise<void>, key: string) {
    super(executor);
    this.params.key = key;
  }

  /**
   * Set a new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    this.params.newKey = newKey;
    return this;
  }

  /**
   * Update the GitHub App ID
   */
  withAppId(appId: string): this {
    this.params.appId = appId;
    return this;
  }

  /**
   * Update the OAuth client ID and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    this.params.clientId = clientId;
    this.params.clientSecret = clientSecret;
    return this;
  }

  /**
   * Update the private key
   */
  withPrivateKey(privateKey: string): this {
    this.params.privateKey = privateKey;
    return this;
  }

  /**
   * Update the GitHub URL
   */
  withUrl(url: string): this {
    this.params.url = url;
    return this;
  }

  /**
   * Update the webhook secret
   */
  withWebhookSecret(webhookSecret: string): this {
    this.params.webhookSecret = webhookSecret;
    return this;
  }

  async execute(): Promise<void> {
    return this.executor(this.params as UpdateGitHubRequest);
  }
}

/**
 * Builder for creating Bitbucket Cloud ALM settings
 */
export class CreateBitbucketCloudBuilder extends BaseAlmBuilder<CreateBitbucketCloudRequest> {
  constructor(executor: (params: CreateBitbucketCloudRequest) => Promise<void>, key: string) {
    super(executor);
    this.params.key = key;
  }

  /**
   * Set the OAuth consumer key (client ID) and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    this.params.clientId = clientId;
    this.params.clientSecret = clientSecret;
    return this;
  }

  /**
   * Set the Bitbucket workspace ID
   */
  withWorkspace(workspace: string): this {
    this.params.workspace = workspace;
    return this;
  }

  async execute(): Promise<void> {
    if (
      this.params.clientId === undefined ||
      this.params.clientId === '' ||
      this.params.clientSecret === undefined ||
      this.params.clientSecret === ''
    ) {
      throw new Error('OAuth consumer key and secret are required');
    }
    if (this.params.workspace === undefined || this.params.workspace === '') {
      throw new Error('Workspace is required');
    }

    return this.executor(this.params as CreateBitbucketCloudRequest);
  }
}

/**
 * Builder for updating Bitbucket Cloud ALM settings
 */
export class UpdateBitbucketCloudBuilder extends BaseAlmBuilder<UpdateBitbucketCloudRequest> {
  constructor(executor: (params: UpdateBitbucketCloudRequest) => Promise<void>, key: string) {
    super(executor);
    this.params.key = key;
  }

  /**
   * Set a new key for the ALM setting
   */
  withNewKey(newKey: string): this {
    this.params.newKey = newKey;
    return this;
  }

  /**
   * Update the OAuth consumer key (client ID) and secret
   */
  withOAuth(clientId: string, clientSecret: string): this {
    this.params.clientId = clientId;
    this.params.clientSecret = clientSecret;
    return this;
  }

  /**
   * Update the Bitbucket workspace ID
   */
  withWorkspace(workspace: string): this {
    this.params.workspace = workspace;
    return this;
  }

  async execute(): Promise<void> {
    return this.executor(this.params as UpdateBitbucketCloudRequest);
  }
}

/**
 * Base builder for project binding operations
 */
abstract class BaseBindingBuilder<TRequest> {
  protected params: Partial<TRequest> = {};

  constructor(
    protected executor: (params: TRequest) => Promise<void>,
    project: string,
    almSetting: string
  ) {
    const projectParams = this.params as { project?: string; almSetting?: string };
    projectParams.project = project;
    projectParams.almSetting = almSetting;
  }

  /**
   * Mark this as a monorepo binding
   */
  asMonorepo(): this {
    const monorepoParams = this.params as { monorepo?: boolean };
    monorepoParams.monorepo = true;
    return this;
  }

  /**
   * Execute the binding operation
   */
  abstract execute(): Promise<void>;
}

/**
 * Builder for setting Azure DevOps bindings
 */
export class SetAzureBindingBuilder extends BaseBindingBuilder<SetAzureBindingRequest> {
  /**
   * Set the Azure project name
   */
  withProjectName(projectName: string): this {
    this.params.projectName = projectName;
    return this;
  }

  /**
   * Set the Azure repository name
   */
  withRepository(repositoryName: string): this {
    this.params.repositoryName = repositoryName;
    return this;
  }

  async execute(): Promise<void> {
    if (this.params.projectName === undefined || this.params.projectName === '') {
      throw new Error('Azure project name is required');
    }
    if (this.params.repositoryName === undefined || this.params.repositoryName === '') {
      throw new Error('Repository name is required');
    }

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
    this.params.repository = repository;
    return this;
  }

  /**
   * Set the repository slug
   */
  withSlug(slug: string): this {
    this.params.slug = slug;
    return this;
  }

  async execute(): Promise<void> {
    if (this.params.repository === undefined || this.params.repository === '') {
      throw new Error('Repository is required');
    }
    if (this.params.slug === undefined || this.params.slug === '') {
      throw new Error('Repository slug is required');
    }

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
    this.params.repository = repository;
    return this;
  }

  async execute(): Promise<void> {
    if (this.params.repository === undefined || this.params.repository === '') {
      throw new Error('Repository is required');
    }

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
    this.params.repository = repository;
    return this;
  }

  /**
   * Enable summary comments on pull requests
   */
  withSummaryComments(enabled = true): this {
    this.params.summaryCommentEnabled = enabled;
    return this;
  }

  async execute(): Promise<void> {
    if (this.params.repository === undefined || this.params.repository === '') {
      throw new Error('Repository is required');
    }

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
    this.params.repository = repository;
    return this;
  }

  async execute(): Promise<void> {
    if (this.params.repository === undefined || this.params.repository === '') {
      throw new Error('Repository is required');
    }

    return this.executor(this.params as SetGitLabBindingRequest);
  }
}
