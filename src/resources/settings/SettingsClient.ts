import { BaseClient } from '../../core/BaseClient';
import { SetSettingBuilder, ResetSettingBuilder, ValuesBuilder } from './builders';
import { addParamIfValid } from './helpers';
import type {
  ListDefinitionsRequest,
  ListDefinitionsResponse,
  SetRequest,
  ResetRequest,
  ValuesRequest,
  ValuesResponse,
} from './types';

/**
 * Client for managing SonarQube settings
 */
export class SettingsClient extends BaseClient {
  /**
   * List settings definitions.
   * Requires 'Browse' permission when a component is specified.
   * To access licensed settings, authentication is required.
   * To access secured settings, one of the following permissions is required:
   * - 'Execute Analysis'
   * - 'Administer' rights on the specified component
   *
   * @param options - Optional parameters
   * @param options.component - Component key
   * @returns Promise that resolves to the list of setting definitions
   * @throws {AuthenticationError} If authentication is required for licensed settings
   * @throws {AuthorizationError} If user lacks required permissions
   *
   * @example
   * ```typescript
   * // Get all global settings definitions
   * const definitions = await client.settings.listDefinitions();
   *
   * // Get settings definitions for a specific component
   * const componentDefinitions = await client.settings.listDefinitions({
   *   component: 'my_project'
   * });
   * ```
   */
  async listDefinitions(options: ListDefinitionsRequest = {}): Promise<ListDefinitionsResponse> {
    const params = new URLSearchParams();

    addParamIfValid(params, 'component', options.component);

    const query = params.toString();
    const endpoint = query
      ? `/api/settings/list_definitions?${query}`
      : '/api/settings/list_definitions';

    return this.request<ListDefinitionsResponse>(endpoint);
  }

  /**
   * Update a setting value.
   * Either 'value' or 'values' must be provided.
   * The settings defined in conf/sonar.properties are read-only and can't be changed.
   * Requires the permission 'Administer' on the specified component.
   *
   * @returns A builder for constructing the set request
   * @throws {AuthorizationError} If user lacks 'Administer' permission
   * @throws {ValidationError} If the setting is read-only or invalid
   *
   * @example
   * ```typescript
   * // Set a simple string value
   * await client.settings.set()
   *   .key('sonar.links.scm')
   *   .value('git@github.com:SonarSource/sonarqube.git')
   *   .execute();
   *
   * // Set multiple values
   * await client.settings.set()
   *   .key('sonar.inclusions')
   *   .values(['src/**', 'lib/**'])
   *   .execute();
   *
   * // Set field values for property set
   * await client.settings.set()
   *   .key('sonar.issue.ignore.multicriteria')
   *   .fieldValues([
   *     { ruleKey: 'java:S1135', resourceKey: '**\/test\/**' },
   *     { ruleKey: 'java:S2589', resourceKey: '**\/generated\/**' }
   *   ])
   *   .execute();
   *
   * // Set component-specific setting
   * await client.settings.set()
   *   .key('sonar.coverage.exclusions')
   *   .value('**\/test\/**,**\/vendor\/**')
   *   .component('my_project')
   *   .execute();
   * ```
   */
  set(): SetSettingBuilder {
    return new SetSettingBuilder(async (params: SetRequest) => {
      const body = new URLSearchParams();

      body.set('key', params.key);

      if (params.value !== undefined) {
        body.set('value', params.value);
      }

      if (params.values) {
        params.values.forEach((value) => {
          body.append('values', value);
        });
      }

      if (params.fieldValues) {
        params.fieldValues.forEach((fieldValue) => {
          body.append('fieldValues', JSON.stringify(fieldValue));
        });
      }

      addParamIfValid(body, 'component', params.component);
      addParamIfValid(body, 'organization', params.organization);

      await this.request('/api/settings/set', {
        method: 'POST',
        body,
      });
    });
  }

  /**
   * Remove a setting value.
   * The settings defined in conf/sonar.properties are read-only and can't be changed.
   * Requires the permission 'Administer' on the specified component.
   *
   * @returns A builder for constructing the reset request
   * @throws {AuthorizationError} If user lacks 'Administer' permission
   * @throws {ValidationError} If the setting is read-only
   *
   * @example
   * ```typescript
   * // Reset a single setting
   * await client.settings.reset()
   *   .keys(['sonar.links.scm'])
   *   .execute();
   *
   * // Reset multiple settings
   * await client.settings.reset()
   *   .keys(['sonar.links.scm', 'sonar.debt.hoursInDay'])
   *   .execute();
   *
   * // Reset component-specific settings
   * await client.settings.reset()
   *   .keys(['sonar.coverage.exclusions'])
   *   .component('my_project')
   *   .execute();
   *
   * // Reset settings on a specific branch
   * await client.settings.reset()
   *   .keys(['sonar.coverage.exclusions'])
   *   .component('my_project')
   *   .branch('feature/my_branch')
   *   .execute();
   * ```
   */
  reset(): ResetSettingBuilder {
    return new ResetSettingBuilder(async (params: ResetRequest) => {
      const body = new URLSearchParams();

      body.set('keys', params.keys);

      addParamIfValid(body, 'component', params.component);
      addParamIfValid(body, 'branch', params.branch);
      addParamIfValid(body, 'pullRequest', params.pullRequest);
      addParamIfValid(body, 'organization', params.organization);

      await this.request('/api/settings/reset', {
        method: 'POST',
        body,
      });
    });
  }

  /**
   * List settings values.
   * If no value has been set for a setting, then the default value is returned.
   * Both component and organization parameters cannot be used together.
   * Requires 'Browse' or 'Execute Analysis' permission when a component is specified.
   * Requires to be member of the organization if one is specified.
   * To access secured settings, one of the following permissions is required:
   * 'Execute Analysis' or 'Administer' rights on the specified component
   *
   * @returns A builder for constructing the values request
   * @throws {AuthenticationError} If authentication is required
   * @throws {AuthorizationError} If user lacks required permissions
   * @throws {ValidationError} If both component and organization are specified
   *
   * @example
   * ```typescript
   * // Get all settings values
   * const allSettings = await client.settings.values().execute();
   *
   * // Get specific settings values
   * const specificSettings = await client.settings.values()
   *   .keys(['sonar.test.inclusions', 'sonar.exclusions'])
   *   .execute();
   *
   * // Get component-specific settings
   * const componentSettings = await client.settings.values()
   *   .component('my_project')
   *   .execute();
   *
   * // Get organization-specific settings
   * const orgSettings = await client.settings.values()
   *   .organization('my-org')
   *   .execute();
   * ```
   */
  values(): ValuesBuilder {
    return new ValuesBuilder(async (params: ValuesRequest) => {
      const searchParams = new URLSearchParams();

      addParamIfValid(searchParams, 'keys', params.keys);
      addParamIfValid(searchParams, 'component', params.component);
      addParamIfValid(searchParams, 'organization', params.organization);

      const query = searchParams.toString();
      const endpoint = query ? `/api/settings/values?${query}` : '/api/settings/values';

      return this.request<ValuesResponse>(endpoint);
    });
  }
}
