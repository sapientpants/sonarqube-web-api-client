import { AlmIntegrationsClient } from './resources/alm-integrations';
import { AlmSettingsClient } from './resources/alm-settings';

interface ProjectsResponse {
  [key: string]: unknown;
  components: unknown[];
}

interface IssuesResponse {
  [key: string]: unknown;
  issues: unknown[];
}

/**
 * Main SonarQube API client
 */
export class SonarQubeClient {
  // Resource clients
  public readonly almIntegrations: AlmIntegrationsClient;
  public readonly almSettings: AlmSettingsClient;

  private readonly baseUrl: string;
  private readonly token: string | undefined;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;

    // Initialize resource clients
    this.almIntegrations = new AlmIntegrationsClient(this.baseUrl, this.token);
    this.almSettings = new AlmSettingsClient(this.baseUrl, this.token);
  }

  // Legacy methods for backward compatibility
  public async getProjects(): Promise<ProjectsResponse> {
    return this.request<ProjectsResponse>('/projects/search');
  }

  public async getIssues(projectKey?: string): Promise<IssuesResponse> {
    const params = new URLSearchParams();
    if (projectKey !== undefined && projectKey.length > 0) {
      params.append('componentKeys', projectKey);
    }
    return this.request<IssuesResponse>(`/issues/search?${params.toString()}`);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (this.token !== undefined && this.token.length > 0) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`SonarQube API error: ${String(response.status)} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}

export default SonarQubeClient;

// Re-export types from ALM integrations
export * from './resources/alm-integrations/types';

// Re-export types from ALM settings
export type * from './resources/alm-settings/types';
