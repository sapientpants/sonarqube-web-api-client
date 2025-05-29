/**
 * Request interface for listing setting definitions
 */
export interface ListDefinitionsRequest {
  /**
   * Component key
   */
  component?: string;
}

/**
 * Setting definition
 */
export interface SettingDefinition {
  /**
   * Setting key
   */
  key: string;
  /**
   * Setting name
   */
  name?: string;
  /**
   * Setting description
   */
  description?: string;
  /**
   * Setting category
   */
  category?: string;
  /**
   * Setting sub-category
   */
  subCategory?: string;
  /**
   * Default value
   */
  defaultValue?: string;
  /**
   * Whether the setting accepts multiple values
   */
  multiValues?: boolean;
  /**
   * Setting type (STRING, TEXT, PASSWORD, BOOLEAN, FLOAT, INTEGER, LICENSE, LONG, SINGLE_SELECT_LIST, PROPERTY_SET)
   */
  type?: string;
  /**
   * Available options for SINGLE_SELECT_LIST type
   */
  options?: string[];
  /**
   * Fields for PROPERTY_SET type
   */
  fields?: SettingField[];
}

/**
 * Field for PROPERTY_SET type settings
 */
export interface SettingField {
  /**
   * Field key
   */
  key: string;
  /**
   * Field name
   */
  name: string;
  /**
   * Field description
   */
  description?: string;
  /**
   * Field type
   */
  type: string;
  /**
   * Available options for SINGLE_SELECT_LIST type
   */
  options?: string[];
}

/**
 * Response interface for listing setting definitions
 */
export interface ListDefinitionsResponse {
  /**
   * List of setting definitions
   */
  definitions: SettingDefinition[];
}

/**
 * Request interface for resetting settings
 */
export interface ResetRequest {
  /**
   * Comma-separated list of keys
   */
  keys: string;
  /**
   * Component key
   */
  component?: string;
  /**
   * Branch key
   */
  branch?: string;
  /**
   * Pull request id
   */
  pullRequest?: string;
  /**
   * Organization key
   */
  organization?: string;
}

/**
 * Request interface for setting a value
 */
export interface SetRequest {
  /**
   * Setting key
   */
  key: string;
  /**
   * Setting value. To reset a value, please use the reset web service.
   */
  value?: string;
  /**
   * Setting multi value. To set several values, the parameter must be called once for each value.
   */
  values?: string[];
  /**
   * Setting field values. To set several values, the parameter must be called once for each value.
   */
  fieldValues?: Array<Record<string, string>>;
  /**
   * Component key
   */
  component?: string;
  /**
   * Organization key (for the Enterprise plan only)
   */
  organization?: string;
}

/**
 * Request interface for getting setting values
 */
export interface ValuesRequest {
  /**
   * List of setting keys
   */
  keys?: string;
  /**
   * Component key
   */
  component?: string;
  /**
   * Organization key
   */
  organization?: string;
}

/**
 * Setting value
 */
export interface SettingValue {
  /**
   * The key of the setting
   */
  key: string;
  /**
   * The value of setting
   */
  value?: string;
  /**
   * The values of multi-value setting
   */
  values?: string[];
  /**
   * The field values of property set setting
   */
  fieldValues?: Array<Record<string, string>>;
  /**
   * True if the value is being inherited from a parent setting
   */
  inherited?: boolean;
  /**
   * The value of the parent setting if the value is not inherited
   */
  parentValue?: string;
  /**
   * The values of the parent multi-value setting
   */
  parentValues?: string[];
  /**
   * The field values of the parent property set setting
   */
  parentFieldValues?: Array<Record<string, string>>;
  /**
   * The origin of the parentValue (INSTANCE, ORGANIZATION, PROJECT)
   */
  parentOrigin?: string;
}

/**
 * Response interface for getting setting values
 */
export interface ValuesResponse {
  /**
   * List of setting values
   */
  settings: SettingValue[];
}
