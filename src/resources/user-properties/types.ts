/**
 * User Properties types
 * @deprecated The user_properties API was removed in SonarQube 6.3. Use favorites and notifications APIs instead.
 * @module
 */

/* eslint-disable @typescript-eslint/no-deprecated */

/**
 * Response from the deprecated user_properties/index endpoint
 * @deprecated This API was removed in SonarQube 6.3
 */
export interface UserPropertiesResponse {
  /**
   * Array of user properties
   * @deprecated Use favorites and notifications APIs instead
   */
  properties: UserProperty[];
}

/**
 * A user property
 * @deprecated This type is from a removed API
 */
export interface UserProperty {
  /**
   * Property key
   * @deprecated Use favorites or notifications based on the property type
   */
  key: string;

  /**
   * Property value
   * @deprecated Use favorites or notifications based on the property type
   */
  value: string;
}
