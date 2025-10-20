import { BaseBuilder, PaginatedBuilder, ParameterHelpers } from '../../core/builders/index.js';
import { ValidationError } from '../../errors/index.js';
import type {
  ActivateRulesRequest,
  ActivateRulesResponse,
  ChangelogEntry,
  ChangelogRequest,
  ChangelogResponse,
  DeactivateRulesRequest,
  DeactivateRulesResponse,
  ProjectAssociation,
  ProjectsRequest,
  ProjectsResponse,
  SearchRequest,
  SearchResponse,
  Severity,
} from './types.js';

/**
 * Builder for activating rules in bulk on a quality profile.
 * Provides a fluent interface for constructing complex rule activation queries.
 *
 * @example
 * ```typescript
 * // Activate all critical bugs
 * const result = await client.qualityProfiles.activateRules()
 *   .targetProfile('java-profile-key')
 *   .severities(['CRITICAL'])
 *   .types(['BUG'])
 *   .targetSeverity('BLOCKER')
 *   .execute();
 *
 * // Activate rules from specific repositories
 * const result = await client.qualityProfiles.activateRules()
 *   .targetProfile('js-profile-key')
 *   .repositories(['eslint', 'tslint'])
 *   .execute();
 * ```
 */
export class ActivateRulesBuilder extends BaseBuilder<ActivateRulesRequest, ActivateRulesResponse> {
  /**
   * Set the target quality profile key (required).
   */
  targetProfile(key: string): this {
    this.params.targetKey = key;
    return this;
  }

  /**
   * Filter on activation status.
   */
  activation = ParameterHelpers.createBooleanMethod<typeof this>('activation');

  /**
   * Comma-separated list of activation severities.
   */
  activeSeverities = ParameterHelpers.createStringMethod<typeof this>('active_severities');

  /**
   * Ascending sort.
   */
  ascending = ParameterHelpers.createBooleanMethod<typeof this>('asc');

  /**
   * Filter rules available since a date.
   */
  availableSince = ParameterHelpers.createStringMethod<typeof this>('available_since');

  /**
   * Comma-separated list of CWE identifiers.
   */
  cwe = ParameterHelpers.createStringMethod<typeof this>('cwe');

  /**
   * Filter by inheritance.
   */
  inheritance = ParameterHelpers.createStringMethod<typeof this>('inheritance');

  /**
   * Filter template rules.
   */
  isTemplate = ParameterHelpers.createBooleanMethod<typeof this>('is_template');

  /**
   * Comma-separated list of languages.
   */
  languages = ParameterHelpers.createStringMethod<typeof this>('languages');

  /**
   * Comma-separated list of OWASP Top 10 2017 categories.
   */
  owaspTop10 = ParameterHelpers.createStringMethod<typeof this>('owaspTop10');

  /**
   * Comma-separated list of OWASP Top 10 2021 categories.
   */

  owaspTop10_2021 = ParameterHelpers.createStringMethod<typeof this>('owaspTop10_2021');

  /**
   * 1-based page number.
   */
  page(value: number): this {
    this.params.p = value;
    return this;
  }

  /**
   * Page size.
   */
  pageSize(value: number): this {
    this.params.ps = value;
    return this;
  }

  /**
   * Search query.
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Quality profile key to filter rules.
   */
  qualityProfile = ParameterHelpers.createStringMethod<typeof this>('qprofile');

  /**
   * Comma-separated list of repositories.
   */
  repositories = ParameterHelpers.createStringMethod<typeof this>('repositories');

  /**
   * Rule key.
   */
  ruleKey = ParameterHelpers.createStringMethod<typeof this>('rule_key');

  /**
   * Sort field.
   */
  sortBy = ParameterHelpers.createStringMethod<typeof this>('s');

  /**
   * Comma-separated list of SANS Top 25 categories.
   */
  sansTop25 = ParameterHelpers.createStringMethod<typeof this>('sans_top25');

  /**
   * Comma-separated list of severities.
   */
  severities = ParameterHelpers.createStringMethod<typeof this>('severities');

  /**
   * Comma-separated list of SonarSource security categories.
   */
  sonarsourceSecurity = ParameterHelpers.createStringMethod<typeof this>('sonarsource_security');

  /**
   * Comma-separated list of statuses.
   */
  statuses = ParameterHelpers.createStringMethod<typeof this>('statuses');

  /**
   * Comma-separated list of tags.
   */
  tags = ParameterHelpers.createStringMethod<typeof this>('tags');

  /**
   * Severity to set on activated rules.
   */
  targetSeverity(severity: Severity): this {
    this.params.targetSeverity = severity;
    return this;
  }

  /**
   * Template key.
   */
  templateKey = ParameterHelpers.createStringMethod<typeof this>('template_key');

  /**
   * Comma-separated list of types.
   */
  types = ParameterHelpers.createStringMethod<typeof this>('types');

  async execute(): Promise<ActivateRulesResponse> {
    const finalParams = this.params as ActivateRulesRequest;
    if (!finalParams.targetKey) {
      throw new ValidationError('Target profile key is required');
    }
    return this.executor(finalParams);
  }
}

/**
 * Builder for deactivating rules in bulk on a quality profile.
 * Extends ActivateRulesBuilder with the same filtering capabilities.
 *
 * @example
 * ```typescript
 * // Deactivate deprecated rules
 * const result = await client.qualityProfiles.deactivateRules()
 *   .targetProfile('java-profile-key')
 *   .statuses(['DEPRECATED'])
 *   .execute();
 * ```
 */
export class DeactivateRulesBuilder extends ActivateRulesBuilder {
  constructor(executor: (params: DeactivateRulesRequest) => Promise<DeactivateRulesResponse>) {
    // Override the executor with proper typing
    super(async (params: ActivateRulesRequest) => {
      // Call the deactivate executor with the same params
      return executor(params) as unknown as Promise<ActivateRulesResponse>;
    });
  }

  override async execute(): Promise<DeactivateRulesResponse> {
    const result = await super.execute();

    return result;
  }
}

/**
 * Builder for paginated quality profile changelog requests.
 *
 * @example
 * ```typescript
 * // Get recent changes
 * const changelog = await client.qualityProfiles.changelog()
 *   .profile('java-profile-key')
 *   .pageSize(50)
 *   .execute();
 *
 * // Iterate through all changes
 * for await (const change of client.qualityProfiles.changelog()
 *   .profile('java-profile-key')
 *   .since('2024-01-01')
 *   .all()) {
 *   console.log(change.action, change.ruleKey);
 * }
 * ```
 */
export class ChangelogBuilder extends PaginatedBuilder<
  ChangelogRequest,
  ChangelogResponse,
  ChangelogEntry
> {
  /**
   * Set the quality profile key.
   */
  profile(key: string): this {
    this.params.key = key;
    return this;
  }

  /**
   * Set the quality profile name and language.
   */
  profileByName(name: string, language: string): this {
    this.params.qualityProfile = name;
    this.params.language = language;
    return this;
  }

  /**
   * Filter changes after this date.
   */
  since = ParameterHelpers.createStringMethod<typeof this>('since');

  /**
   * Filter changes before this date.
   */
  to = ParameterHelpers.createStringMethod<typeof this>('to');

  protected getItems(response: ChangelogResponse): ChangelogEntry[] {
    return response.events;
  }

  async execute(): Promise<ChangelogResponse> {
    const finalParams = this.params as ChangelogRequest;
    if (
      (finalParams.key === undefined || finalParams.key === '') &&
      (finalParams.qualityProfile === undefined ||
        finalParams.qualityProfile === '' ||
        finalParams.language === undefined ||
        finalParams.language === '')
    ) {
      throw new ValidationError('Either key or both qualityProfile and language must be provided');
    }
    return this.executor(finalParams);
  }
}

/**
 * Builder for paginated quality profile projects requests.
 *
 * @example
 * ```typescript
 * // Get associated projects
 * const projects = await client.qualityProfiles.projects()
 *   .profile('java-profile-key')
 *   .selected('selected')
 *   .execute();
 *
 * // Search for projects
 * const projects = await client.qualityProfiles.projects()
 *   .profile('java-profile-key')
 *   .query('mobile')
 *   .all();
 * ```
 */
export class ProjectsBuilder extends PaginatedBuilder<
  ProjectsRequest,
  ProjectsResponse,
  ProjectAssociation
> {
  /**
   * Set the quality profile key (required).
   */
  profile(key: string): this {
    this.params.key = key;
    return this;
  }

  /**
   * Search query for project name.
   */
  query = ParameterHelpers.createStringMethod<typeof this>('q');

  /**
   * Filter by selection status.
   */
  selected(value: 'all' | 'selected' | 'deselected'): this {
    this.params.selected = value;
    return this;
  }

  protected getItems(response: ProjectsResponse): ProjectAssociation[] {
    return response.results;
  }

  async execute(): Promise<ProjectsResponse> {
    const finalParams = this.params as ProjectsRequest;
    if (!finalParams.key) {
      throw new ValidationError('Profile key is required');
    }
    return this.executor(finalParams);
  }
}

/**
 * Builder for searching quality profiles.
 *
 * @example
 * ```typescript
 * // Search for Java profiles
 * const profiles = await client.qualityProfiles.search()
 *   .language('java')
 *   .defaults(true)
 *   .execute();
 *
 * // Get profiles for a project
 * const profiles = await client.qualityProfiles.search()
 *   .project('my-project')
 *   .execute();
 * ```
 */
export class SearchBuilder extends BaseBuilder<SearchRequest, SearchResponse> {
  /**
   * Return only default profiles.
   */
  defaults = ParameterHelpers.createBooleanMethod<typeof this>('defaults');

  /**
   * Filter by language.
   */
  language = ParameterHelpers.createStringMethod<typeof this>('language');

  /**
   * Filter by project key.
   */
  project = ParameterHelpers.createStringMethod<typeof this>('project');

  /**
   * Filter by quality profile name.
   */
  qualityProfile = ParameterHelpers.createStringMethod<typeof this>('qualityProfile');

  /**
   * Organization key.
   */
  organization = ParameterHelpers.createStringMethod<typeof this>('organization');

  async execute(): Promise<SearchResponse> {
    return this.executor(this.params as SearchRequest);
  }
}
