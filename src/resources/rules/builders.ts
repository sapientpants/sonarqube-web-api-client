import { PaginatedBuilder } from '../../core/builders';
import type {
  SearchRulesRequest,
  SearchRulesResponse,
  Rule,
  RuleSeverity,
  RuleStatus,
  RuleType,
  CleanCodeAttributeCategory,
  SoftwareQuality,
  ImpactSeverity,
  RuleInheritance,
} from './types';

/**
 * Builder for constructing complex rule search queries
 */
export class SearchRulesBuilder extends PaginatedBuilder<
  SearchRulesRequest,
  SearchRulesResponse,
  Rule
> {
  /**
   * Filter rules that are activated or deactivated on the selected Quality profile
   */
  withActivation(activated: boolean): this {
    return this.setParam('activation', activated);
  }

  /**
   * Filter by activation severities
   */
  withActiveSeverities(severities: RuleSeverity[]): this {
    return this.setParam('active_severities', severities);
  }

  /**
   * Filter rules added since specified date (yyyy-MM-dd format)
   */
  availableSince(date: string): this {
    return this.setParam('available_since', date);
  }

  /**
   * Filter by Clean Code attribute categories
   */
  withCleanCodeAttributeCategories(categories: CleanCodeAttributeCategory[]): this {
    return this.setParam('cleanCodeAttributeCategories', categories);
  }

  /**
   * Filter by CWE identifiers
   */
  withCwe(cweIds: string[]): this {
    return this.setParam('cwe', cweIds);
  }

  /**
   * Specify fields to be returned in response
   */
  withFields(fields: string[]): this {
    return this.setParam('f', fields);
  }

  /**
   * Request facets for aggregated data
   */
  withFacets(facets: string[]): this {
    return this.setParam('facets', facets);
  }

  /**
   * Filter by impact severities
   */
  withImpactSeverities(severities: ImpactSeverity[]): this {
    return this.setParam('impactSeverities', severities);
  }

  /**
   * Filter by software quality impacts
   */
  withImpactSoftwareQualities(qualities: SoftwareQuality[]): this {
    return this.setParam('impactSoftwareQualities', qualities);
  }

  /**
   * Include external engine rules in the results
   */
  includeExternal(include = true): this {
    return this.setParam('include_external', include);
  }

  /**
   * Filter by inheritance values for a rule within a quality profile
   */
  withInheritance(inheritance: RuleInheritance[]): this {
    return this.setParam('inheritance', inheritance);
  }

  /**
   * Filter template rules
   */
  isTemplate(template: boolean): this {
    return this.setParam('is_template', template);
  }

  /**
   * Filter by programming languages
   */
  withLanguages(languages: string[]): this {
    return this.setParam('languages', languages);
  }

  /**
   * Filter by organization
   */
  inOrganization(organization: string): this {
    return this.setParam('organization', organization);
  }

  /**
   * Filter by OWASP Top 10 categories
   */
  withOwaspTop10(categories: string[]): this {
    return this.setParam('owaspTop10', categories);
  }

  /**
   * Filter by OWASP Top 10 2021 categories
   */
  withOwaspTop10v2021(categories: string[]): this {
    return this.setParam('owaspTop10-2021', categories);
  }

  /**
   * Search rules by query string
   */
  withQuery(query: string): this {
    return this.setParam('q', query);
  }

  /**
   * Filter by quality profile key
   */
  inQualityProfile(profileKey: string): this {
    return this.setParam('qprofile', profileKey);
  }

  /**
   * Filter by repositories
   */
  withRepositories(repositories: string[]): this {
    return this.setParam('repositories', repositories);
  }

  /**
   * Search for a specific rule by key
   */
  withRuleKey(key: string): this {
    return this.setParam('rule_key', key);
  }

  /**
   * Filter by multiple rule keys
   */
  withRuleKeys(keys: string[]): this {
    return this.setParam('rule_keys', keys);
  }

  /**
   * Set sorting field and order
   */
  sortBy(field: 'name' | 'updatedAt' | 'createdAt' | 'key', ascending = true): this {
    this.setParam('s', field);
    return this.setParam('asc', ascending);
  }

  /**
   * Filter by default severities
   */
  withSeverities(severities: RuleSeverity[]): this {
    return this.setParam('severities', severities);
  }

  /**
   * Filter by SonarSource security categories
   */
  withSonarSourceSecurity(categories: string[]): this {
    return this.setParam('sonarsourceSecurity', categories);
  }

  /**
   * Filter by rule statuses
   */
  withStatuses(statuses: RuleStatus[]): this {
    return this.setParam('statuses', statuses);
  }

  /**
   * Filter by tags
   */
  withTags(tags: string[]): this {
    return this.setParam('tags', tags);
  }

  /**
   * Filter by template rule key
   */
  withTemplateKey(key: string): this {
    return this.setParam('template_key', key);
  }

  /**
   * Filter by rule types
   */
  withTypes(types: RuleType[]): this {
    return this.setParam('types', types);
  }

  /**
   * Execute the search and return a single page
   */
  async execute(): Promise<SearchRulesResponse> {
    return this.executor(this.params as SearchRulesRequest);
  }

  /**
   * Get items from response for pagination
   */
  protected getItems(response: SearchRulesResponse): Rule[] {
    return response.rules;
  }
}
