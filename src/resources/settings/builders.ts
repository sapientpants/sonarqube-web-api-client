import { BaseBuilder } from '../../core/builders';
import { ValidationError } from '../../errors';
import { ParameterHelpers } from '../../core/builders/helpers/ParameterHelpers';
import { isValidParam, splitKeys } from './helpers';
import type { SetRequest, ResetRequest, ValuesRequest, ValuesResponse } from './types';

/**
 * Builder for setting values
 */
export class SetSettingBuilder extends BaseBuilder<SetRequest> {
  component = ParameterHelpers.createStringMethod<SetSettingBuilder>('component');
  organization = ParameterHelpers.createStringMethod<SetSettingBuilder>('organization');

  /**
   * Set the setting key
   * @param key - Setting key
   */
  key(key: string): this {
    return this.setParam('key', key);
  }

  /**
   * Set a single value
   * @param value - Setting value
   */
  value(value: string): this {
    return this.setParam('value', value);
  }

  /**
   * Set multiple values
   * @param values - Array of values
   */
  values(values: string[]): this {
    return this.setParam('values', values);
  }

  /**
   * Add a single value to the values array
   * @param value - Value to add
   */
  addValue(value: string): this {
    const currentValues = this.params.values ?? [];
    return this.setParam('values', [...currentValues, value]);
  }

  /**
   * Set field values for property set settings
   * @param fieldValues - Array of field value objects
   */
  fieldValues(fieldValues: Array<Record<string, string>>): this {
    return this.setParam('fieldValues', fieldValues);
  }

  /**
   * Add a field value object
   * @param fieldValue - Field value object to add
   */
  addFieldValue(fieldValue: Record<string, string>): this {
    const currentFieldValues = this.params.fieldValues ?? [];
    return this.setParam('fieldValues', [...currentFieldValues, fieldValue]);
  }

  /**
   * Execute the request
   */
  async execute(): Promise<void> {
    if (!isValidParam(this.params.key)) {
      throw new ValidationError('Setting key is required', 'MISSING_KEY');
    }

    // Validate that at least one value type is provided
    if (
      this.params.value === undefined &&
      this.params.values === undefined &&
      this.params.fieldValues === undefined
    ) {
      throw new ValidationError(
        'Either value, values, or fieldValues must be provided',
        'MISSING_VALUE',
      );
    }

    // Validate that only one value type is provided
    const valueTypes = [this.params.value, this.params.values, this.params.fieldValues].filter(
      Boolean,
    );
    if (valueTypes.length > 1) {
      throw new ValidationError(
        'Only one of value, values, or fieldValues can be provided',
        'MULTIPLE_VALUE_TYPES',
      );
    }

    return this.executor(this.params as SetRequest);
  }
}

/**
 * Builder for resetting settings
 */
export class ResetSettingBuilder extends BaseBuilder<ResetRequest> {
  component = ParameterHelpers.createStringMethod<ResetSettingBuilder>('component');
  branch = ParameterHelpers.createStringMethod<ResetSettingBuilder>('branch');
  pullRequest = ParameterHelpers.createStringMethod<ResetSettingBuilder>('pullRequest');
  organization = ParameterHelpers.createStringMethod<ResetSettingBuilder>('organization');

  /**
   * Set the keys to reset
   * @param keys - Array of setting keys
   */
  keys(keys: string[]): this {
    return this.setParam('keys', keys.join(','));
  }

  /**
   * Add a key to reset
   * @param key - Setting key to add
   */
  addKey(key: string): this {
    const currentKeys = splitKeys(this.params.keys);
    return this.setParam('keys', [...currentKeys, key].join(','));
  }

  /**
   * Execute the request
   */
  async execute(): Promise<void> {
    if (!isValidParam(this.params.keys)) {
      throw new ValidationError('At least one key is required', 'MISSING_KEYS');
    }

    return this.executor(this.params as ResetRequest);
  }
}

/**
 * Builder for getting setting values
 */
export class ValuesBuilder extends BaseBuilder<ValuesRequest, ValuesResponse> {
  component = ParameterHelpers.createStringMethod<ValuesBuilder>('component');
  organization = ParameterHelpers.createStringMethod<ValuesBuilder>('organization');

  /**
   * Set the keys to retrieve
   * @param keys - Array of setting keys
   */
  keys(keys: string[]): this {
    return this.setParam('keys', keys.join(','));
  }

  /**
   * Add a key to retrieve
   * @param key - Setting key to add
   */
  addKey(key: string): this {
    const currentKeys = splitKeys(this.params.keys);
    return this.setParam('keys', [...currentKeys, key].join(','));
  }

  /**
   * Execute the request
   */
  async execute(): Promise<ValuesResponse> {
    // Component and organization cannot be used together
    if (isValidParam(this.params.component) && isValidParam(this.params.organization)) {
      throw new ValidationError(
        'Both component and organization parameters cannot be used together',
        'CONFLICTING_PARAMS',
      );
    }

    return this.executor(this.params as ValuesRequest);
  }
}
