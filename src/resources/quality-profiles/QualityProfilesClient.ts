import { BaseClient } from '../../core/BaseClient.js';
import { DeprecationManager } from '../../core/deprecation/index.js';
import { ValidationError } from '../../errors/index.js';
import {
  ActivateRulesBuilder,
  ChangelogBuilder,
  DeactivateRulesBuilder,
  ProjectsBuilder,
  SearchBuilder,
} from './builders.js';
import type {
  ActivateRuleRequest,
  AddProjectRequest,
  BackupRequest,
  ChangeParentRequest,
  CompareRequest,
  CompareResponse,
  CopyRequest,
  CopyResponse,
  CreateRequest,
  CreateResponse,
  DeactivateRuleRequest,
  DeleteRequest,
  ExportRequest,
  ExportersResponse,
  ImportersResponse,
  InheritanceRequest,
  InheritanceResponse,
  ProjectAssociation,
  RemoveProjectRequest,
  RenameRequest,
  RestoreRequest,
  RestoreResponse,
  SetDefaultRequest,
} from './types.js';

/**
 * Client for interacting with the SonarQube Quality Profiles API.
 * Provides methods for managing quality profiles, their rules, and associations.
 *
 * Quality profiles are collections of rules that define code quality standards
 * for specific programming languages in SonarQube.
 */
export class QualityProfilesClient extends BaseClient {
  /**
   * Activate a rule on a quality profile.
   *
   * @param params - The activation parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If the profile or rule doesn't exist
   * @throws {ValidationError} If the parameters are invalid
   *
   * @example
   * ```typescript
   * // Activate a rule with default severity
   * await client.qualityProfiles.activateRule({
   *   key: 'java-profile-key',
   *   rule: 'squid:S1234'
   * });
   *
   * // Activate with custom severity and parameters
   * await client.qualityProfiles.activateRule({
   *   key: 'java-profile-key',
   *   rule: 'squid:S1234',
   *   severity: 'CRITICAL',
   *   params: 'threshold=10;format=^[A-Z][a-zA-Z0-9]*$'
   * });
   * ```
   */
  async activateRule(params: ActivateRuleRequest): Promise<void> {
    await this.request('/api/qualityprofiles/activate_rule', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Bulk-activate rules on a quality profile based on search criteria.
   *
   * @returns A builder for constructing the bulk activation request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   *
   * @example
   * ```typescript
   * // Activate all critical bugs
   * const result = await client.qualityProfiles.activateRules()
   *   .targetProfile('java-profile-key')
   *   .severities('CRITICAL')
   *   .types('BUG')
   *   .execute();
   *
   * console.log(`Activated ${result.succeeded} rules`);
   * ```
   */
  activateRules(): ActivateRulesBuilder {
    return new ActivateRulesBuilder(async (params) => {
      return this.request('/api/qualityprofiles/activate_rules', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    });
  }

  /**
   * Associate a project with a quality profile.
   *
   * @param params - The association parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission or 'Administer' permission on the project
   * @throws {NotFoundError} If the profile or project doesn't exist
   *
   * @example
   * ```typescript
   * // Associate using profile key
   * await client.qualityProfiles.addProject({
   *   key: 'java-profile-key',
   *   project: 'my-project'
   * });
   *
   * // Associate using profile name and language
   * await client.qualityProfiles.addProject({
   *   qualityProfile: 'Sonar way',
   *   language: 'java',
   *   project: 'my-project'
   * });
   * ```
   */
  async addProject(params: AddProjectRequest): Promise<void> {
    this.validateProfileIdentification(params);
    this.validateProjectIdentification(params);
    await this.request('/api/qualityprofiles/add_project', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Backup a quality profile in XML format.
   * The response is the XML content that can be used with the restore endpoint.
   *
   * @param params - The backup parameters
   * @returns The XML backup content
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the profile doesn't exist
   *
   * @example
   * ```typescript
   * // Backup a profile
   * const xml = await client.qualityProfiles.backup({
   *   key: 'java-profile-key'
   * });
   *
   * // Save to file
   * fs.writeFileSync('profile-backup.xml', xml);
   * ```
   */
  async backup(params: BackupRequest): Promise<string> {
    this.validateProfileIdentification(params);
    const query = new URLSearchParams();
    if (params.key !== undefined && params.key !== '') {
      query.append('key', params.key);
    } else if (
      params.qualityProfile !== undefined &&
      params.qualityProfile !== '' &&
      params.language !== undefined &&
      params.language !== ''
    ) {
      query.append('qualityProfile', params.qualityProfile);
      query.append('language', params.language);
    }
    return this.request<string>(`/api/qualityprofiles/backup?${query.toString()}`, {
      method: 'GET',
      responseType: 'text',
      headers: {
        Accept: 'application/xml',
      },
    });
  }

  /**
   * Change a quality profile's parent profile.
   *
   * @param params - The parent change parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If either profile doesn't exist
   * @throws {ValidationError} If the operation would create a circular inheritance
   *
   * @example
   * ```typescript
   * // Set a parent profile
   * await client.qualityProfiles.changeParent({
   *   key: 'custom-java-profile',
   *   parentKey: 'company-java-base'
   * });
   *
   * // Remove parent (make profile standalone)
   * await client.qualityProfiles.changeParent({
   *   key: 'custom-java-profile'
   *   // parentKey omitted
   * });
   * ```
   */
  async changeParent(params: ChangeParentRequest): Promise<void> {
    this.validateProfileIdentification(params);
    await this.request('/api/qualityprofiles/change_parent', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get the history of changes on a quality profile.
   * Changes include rule activations/deactivations and configuration changes.
   *
   * @returns A builder for constructing the changelog request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the profile doesn't exist
   *
   * @example
   * ```typescript
   * // Get recent changes
   * const changelog = await client.qualityProfiles.changelog()
   *   .profile('java-profile-key')
   *   .pageSize(50)
   *   .execute();
   *
   * // Iterate through all changes since a date
   * for await (const change of client.qualityProfiles.changelog()
   *   .profile('java-profile-key')
   *   .since('2024-01-01')
   *   .all()) {
   *   console.log(`${change.date}: ${change.action} - ${change.ruleName}`);
   * }
   * ```
   */
  changelog(): ChangelogBuilder {
    return new ChangelogBuilder(async (params) => {
      const query = new URLSearchParams();
      if (params.key !== undefined && params.key !== '') {
        query.append('key', params.key);
      } else if (
        params.qualityProfile !== undefined &&
        params.qualityProfile !== '' &&
        params.language !== undefined &&
        params.language !== ''
      ) {
        query.append('qualityProfile', params.qualityProfile);
        query.append('language', params.language);
      }
      if (params.p !== undefined) {
        query.append('p', String(params.p));
      }
      if (params.ps !== undefined) {
        query.append('ps', String(params.ps));
      }
      if (params.since !== undefined && params.since !== '') {
        query.append('since', params.since);
      }
      if (params.to !== undefined && params.to !== '') {
        query.append('to', params.to);
      }

      return this.request(`/api/qualityprofiles/changelog?${query.toString()}`);
    });
  }

  /**
   * Compare two quality profiles to see their differences.
   *
   * @param params - The comparison parameters
   * @returns The comparison results showing rules in each profile
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If either profile doesn't exist
   * @throws {ValidationError} If comparing profiles of different languages
   *
   * @example
   * ```typescript
   * const comparison = await client.qualityProfiles.compare({
   *   leftKey: 'old-profile',
   *   rightKey: 'new-profile'
   * });
   *
   * console.log(`Rules only in old: ${comparison.inLeft.length}`);
   * console.log(`Rules only in new: ${comparison.inRight.length}`);
   * console.log(`Modified rules: ${comparison.modified.length}`);
   * ```
   */
  async compare(params: CompareRequest): Promise<CompareResponse> {
    const query = new URLSearchParams();
    if (params.leftKey !== undefined && params.leftKey !== '') {
      query.append('leftKey', params.leftKey);
    } else if (params.leftQualityProfile !== undefined && params.leftQualityProfile !== '') {
      query.append('leftQualityProfile', params.leftQualityProfile);
    }
    if (params.rightKey !== undefined && params.rightKey !== '') {
      query.append('rightKey', params.rightKey);
    } else if (params.rightQualityProfile !== undefined && params.rightQualityProfile !== '') {
      query.append('rightQualityProfile', params.rightQualityProfile);
    }

    return this.request(`/api/qualityprofiles/compare?${query.toString()}`);
  }

  /**
   * Copy a quality profile.
   * The copy will have the same rules and configuration as the source.
   *
   * @param params - The copy parameters
   * @returns The created profile details
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If the source profile doesn't exist
   * @throws {ValidationError} If a profile with the target name already exists
   *
   * @example
   * ```typescript
   * const newProfile = await client.qualityProfiles.copy({
   *   fromKey: 'source-profile',
   *   toName: 'Custom Java Profile'
   * });
   *
   * console.log(`Created profile: ${newProfile.key}`);
   * ```
   */
  async copy(params: CopyRequest): Promise<CopyResponse> {
    return this.request('/api/qualityprofiles/copy', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a new quality profile.
   *
   * @param params - The creation parameters
   * @returns The created profile details and any warnings
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {ValidationError} If a profile with the same name and language already exists
   *
   * @example
   * ```typescript
   * const result = await client.qualityProfiles.create({
   *   name: 'Strict Java Rules',
   *   language: 'java'
   * });
   *
   * console.log(`Created profile: ${result.profile.key}`);
   * if (result.warnings) {
   *   console.log('Warnings:', result.warnings);
   * }
   * ```
   */
  async create(params: CreateRequest): Promise<CreateResponse> {
    return this.request('/api/qualityprofiles/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Deactivate a rule on a quality profile.
   *
   * @param params - The deactivation parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If the profile or rule doesn't exist
   *
   * @example
   * ```typescript
   * await client.qualityProfiles.deactivateRule({
   *   key: 'java-profile-key',
   *   rule: 'squid:S1234'
   * });
   * ```
   */
  async deactivateRule(params: DeactivateRuleRequest): Promise<void> {
    await this.request('/api/qualityprofiles/deactivate_rule', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Bulk-deactivate rules on a quality profile based on search criteria.
   *
   * @returns A builder for constructing the bulk deactivation request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   *
   * @example
   * ```typescript
   * // Deactivate all deprecated rules
   * const result = await client.qualityProfiles.deactivateRules()
   *   .targetProfile('java-profile-key')
   *   .statuses('DEPRECATED')
   *   .execute();
   *
   * console.log(`Deactivated ${result.succeeded} rules`);
   * ```
   */
  deactivateRules(): DeactivateRulesBuilder {
    return new DeactivateRulesBuilder(async (params) => {
      return this.request('/api/qualityprofiles/deactivate_rules', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    });
  }

  /**
   * Delete a quality profile and all its descendants.
   * The default profile cannot be deleted.
   *
   * @param params - The deletion parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If the profile doesn't exist
   * @throws {ValidationError} If trying to delete the default profile
   *
   * @example
   * ```typescript
   * await client.qualityProfiles.delete({
   *   key: 'obsolete-profile'
   * });
   * ```
   */
  async delete(params: DeleteRequest): Promise<void> {
    this.validateProfileIdentification(params);
    await this.request('/api/qualityprofiles/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Export a quality profile.
   *
   * @param params - The export parameters
   * @returns The exported content (format depends on the exporter)
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the profile doesn't exist
   * @throws {ValidationError} If the exporter is not available for the profile's language
   *
   * @example
   * ```typescript
   * // Export using default exporter
   * const xml = await client.qualityProfiles.export({
   *   key: 'java-profile-key'
   * });
   *
   * // Export using specific exporter
   * const config = await client.qualityProfiles.export({
   *   key: 'js-profile-key',
   *   exporterKey: 'eslint'
   * });
   * ```
   */
  async export(params: ExportRequest): Promise<string> {
    this.validateProfileIdentification(params);
    const query = new URLSearchParams();
    if (params.key !== undefined && params.key !== '') {
      query.append('key', params.key);
    } else if (
      params.qualityProfile !== undefined &&
      params.qualityProfile !== '' &&
      params.language !== undefined &&
      params.language !== ''
    ) {
      query.append('qualityProfile', params.qualityProfile);
      query.append('language', params.language);
    }
    if (params.exporterKey !== undefined && params.exporterKey !== '') {
      query.append('exporterKey', params.exporterKey);
    }

    return this.request<string>(`/api/qualityprofiles/export?${query.toString()}`, {
      responseType: 'text',
    });
  }

  /**
   * List available profile exporters.
   *
   * @deprecated Since 18 March, 2025 - This endpoint will be removed
   * @returns The list of available exporters
   * @throws {AuthenticationError} If the user is not authenticated
   *
   * @example
   * ```typescript
   * const exporters = await client.qualityProfiles.exporters();
   * exporters.exporters.forEach(e => {
   *   console.log(`${e.name}: ${e.languages.join(', ')}`);
   * });
   * ```
   */
  async exporters(): Promise<ExportersResponse> {
    DeprecationManager.warn({
      api: 'qualityProfiles.exporters()',
      removeVersion: 'March 18, 2025',
      reason: 'This endpoint will be removed.',
    });
    return this.request('/api/qualityprofiles/exporters');
  }

  /**
   * List supported importers.
   *
   * @deprecated Since 18 March, 2025 - This endpoint will be removed
   * @returns The list of available importers
   * @throws {AuthenticationError} If the user is not authenticated
   *
   * @example
   * ```typescript
   * const importers = await client.qualityProfiles.importers();
   * importers.importers.forEach(i => {
   *   console.log(`${i.name}: ${i.languages.join(', ')}`);
   * });
   * ```
   */
  async importers(): Promise<ImportersResponse> {
    DeprecationManager.warn({
      api: 'qualityProfiles.importers()',
      removeVersion: 'March 18, 2025',
      reason: 'This endpoint will be removed.',
    });
    return this.request('/api/qualityprofiles/importers');
  }

  /**
   * Show a quality profile's ancestors and children.
   *
   * @param params - The inheritance request parameters
   * @returns The profile's inheritance hierarchy
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {NotFoundError} If the profile doesn't exist
   *
   * @example
   * ```typescript
   * const inheritance = await client.qualityProfiles.inheritance({
   *   key: 'custom-java-profile'
   * });
   *
   * console.log('Parent:', inheritance.ancestors[0]?.name);
   * console.log('Children:', inheritance.children.map(c => c.name));
   * ```
   */
  async inheritance(params: InheritanceRequest): Promise<InheritanceResponse> {
    this.validateProfileIdentification(params);
    const query = new URLSearchParams();
    if (params.key !== undefined && params.key !== '') {
      query.append('key', params.key);
    } else if (
      params.qualityProfile !== undefined &&
      params.qualityProfile !== '' &&
      params.language !== undefined &&
      params.language !== ''
    ) {
      query.append('qualityProfile', params.qualityProfile);
      query.append('language', params.language);
    }

    return this.request(`/api/qualityprofiles/inheritance?${query.toString()}`);
  }

  /**
   * List projects with their association status for a quality profile.
   *
   * @returns A builder for constructing the projects request
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If the profile doesn't exist
   *
   * @example
   * ```typescript
   * // Get associated projects
   * const projects = await client.qualityProfiles.projects()
   *   .profile('java-profile-key')
   *   .selected('selected')
   *   .execute();
   *
   * // Search for projects to associate
   * for await (const project of client.qualityProfiles.projects()
   *   .profile('java-profile-key')
   *   .query('mobile')
   *   .selected('deselected')
   *   .all()) {
   *   console.log(`Can associate: ${project.name}`);
   * }
   * ```
   */
  projects(): ProjectsBuilder {
    return new ProjectsBuilder(async (params) => {
      const query = new URLSearchParams();
      query.append('key', params.key);
      if (params.p !== undefined) {
        query.append('p', String(params.p));
      }
      if (params.ps !== undefined) {
        query.append('ps', String(params.ps));
      }
      if (params.q !== undefined && params.q !== '') {
        query.append('q', params.q);
      }
      if (params.selected !== undefined) {
        query.append('selected', params.selected);
      }

      return this.request(`/api/qualityprofiles/projects?${query.toString()}`);
    });
  }

  /**
   * Convenience method to iterate through all projects for a profile.
   * This is equivalent to calling projects().profile(key).all()
   *
   * @param profileKey - The quality profile key
   * @returns An async iterator for all projects
   *
   * @example
   * ```typescript
   * for await (const project of client.qualityProfiles.projectsAll('java-profile-key')) {
   *   console.log(project.name, project.selected ? 'associated' : 'not associated');
   * }
   * ```
   */
  projectsAll(profileKey: string): AsyncIterableIterator<ProjectAssociation> {
    return this.projects().profile(profileKey).pageSize(500).all();
  }

  /**
   * Remove a project's association with a quality profile.
   *
   * @param params - The removal parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have proper permissions
   * @throws {NotFoundError} If the profile or project doesn't exist
   *
   * @example
   * ```typescript
   * await client.qualityProfiles.removeProject({
   *   key: 'java-profile-key',
   *   project: 'my-project'
   * });
   * ```
   */
  async removeProject(params: RemoveProjectRequest): Promise<void> {
    this.validateProfileIdentification(params);
    this.validateProjectIdentification(params);
    await this.request('/api/qualityprofiles/remove_project', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Rename a quality profile.
   *
   * @param params - The rename parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If the profile doesn't exist
   * @throws {ValidationError} If a profile with the new name already exists
   *
   * @example
   * ```typescript
   * await client.qualityProfiles.rename({
   *   key: 'java-profile-key',
   *   name: 'Company Java Standards v2'
   * });
   * ```
   */
  async rename(params: RenameRequest): Promise<void> {
    await this.request('/api/qualityprofiles/rename', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Restore a quality profile from an XML backup.
   * If the profile already exists, it will be updated.
   *
   * @param params - The restore parameters
   * @returns Information about the restored profile
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {ValidationError} If the backup content is invalid
   *
   * @example
   * ```typescript
   * const xmlContent = fs.readFileSync('profile-backup.xml', 'utf-8');
   * const result = await client.qualityProfiles.restore({
   *   backup: xmlContent,
   *   organization: 'my-org'
   * });
   *
   * console.log(`Restored profile: ${result.profile.name}`);
   * console.log(`Rules restored: ${result.ruleSuccesses}`);
   * console.log(`Rules failed: ${result.ruleFailures}`);
   * ```
   */
  async restore(params: RestoreRequest): Promise<RestoreResponse> {
    return this.request('/api/qualityprofiles/restore', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Search for quality profiles.
   *
   * @returns A builder for constructing the search request
   * @throws {AuthenticationError} If the user is not authenticated
   *
   * @example
   * ```typescript
   * // Get default profiles
   * const defaults = await client.qualityProfiles.search()
   *   .defaults(true)
   *   .execute();
   *
   * // Get profiles for a specific language
   * const javaProfiles = await client.qualityProfiles.search()
   *   .language('java')
   *   .execute();
   *
   * // Get profiles used by a project
   * const projectProfiles = await client.qualityProfiles.search()
   *   .project('my-project')
   *   .execute();
   * ```
   */
  search(): SearchBuilder {
    return new SearchBuilder(async (params) => {
      const query = new URLSearchParams();
      if (params.defaults !== undefined) {
        query.append('defaults', String(params.defaults));
      }
      if (params.language !== undefined && params.language !== '') {
        query.append('language', params.language);
      }
      if (params.project !== undefined && params.project !== '') {
        query.append('project', params.project);
      }
      if (params.qualityProfile !== undefined && params.qualityProfile !== '') {
        query.append('qualityProfile', params.qualityProfile);
      }
      if (params.organization !== undefined && params.organization !== '') {
        query.append('organization', params.organization);
      }

      const queryString = query.toString();
      const url = queryString
        ? `/api/qualityprofiles/search?${queryString}`
        : '/api/qualityprofiles/search';
      return this.request(url);
    });
  }

  /**
   * Set the default profile for a given language.
   *
   * @param params - The default profile parameters
   * @throws {AuthenticationError} If the user is not authenticated
   * @throws {AuthorizationError} If the user doesn't have 'Administer Quality Profiles' permission
   * @throws {NotFoundError} If the profile doesn't exist
   *
   * @example
   * ```typescript
   * await client.qualityProfiles.setDefault({
   *   key: 'strict-java-profile'
   * });
   * ```
   */
  async setDefault(params: SetDefaultRequest): Promise<void> {
    this.validateProfileIdentification(params);
    await this.request('/api/qualityprofiles/set_default', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Validate that profile identification is provided (either key or qualityProfile+language).
   */
  private validateProfileIdentification(params: {
    key?: string;
    qualityProfile?: string;
    language?: string;
  }): void {
    if (
      (params.key === undefined || params.key === '') &&
      (params.qualityProfile === undefined ||
        params.qualityProfile === '' ||
        params.language === undefined ||
        params.language === '')
    ) {
      throw new ValidationError('Either key or both qualityProfile and language must be provided');
    }
  }

  /**
   * Validate that project identification is provided (either project or projectUuid).
   */
  private validateProjectIdentification(params: { project?: string; projectUuid?: string }): void {
    if (
      (params.project === undefined || params.project === '') &&
      (params.projectUuid === undefined || params.projectUuid === '')
    ) {
      throw new ValidationError('Either project or projectUuid must be provided');
    }
  }
}
