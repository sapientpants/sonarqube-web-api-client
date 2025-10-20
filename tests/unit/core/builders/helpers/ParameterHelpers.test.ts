// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { ParameterHelpers } from '../../../../../src/core/builders/helpers/ParameterHelpers.js';
import { BaseBuilder } from '../../../../../src/core/builders/BaseBuilder.js';

// Test implementation of BaseBuilder
class TestBuilder extends BaseBuilder<{
  flag?: boolean;
  text?: string;
  items?: string[];
  optional?: string;
}> {
  // Test methods using ParameterHelpers
  enableFlag = ParameterHelpers.createBooleanMethod<TestBuilder>('flag');
  setFlag = ParameterHelpers.createBooleanMethod<TestBuilder>('flag', false);
  setText = ParameterHelpers.createStringMethod<TestBuilder>('text');
  setItems = ParameterHelpers.createArrayMethod<TestBuilder>('items');
  setOptional = ParameterHelpers.createOptionalStringMethod<TestBuilder>('optional');

  async execute(): Promise<void> {
    return this.executor(this.params as Parameters<typeof this.executor>[0]);
  }
}

describe('ParameterHelpers', () => {
  let executor: Mock;
  let builder: TestBuilder;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestBuilder(executor);
  });

  describe('createBooleanMethod', () => {
    it('should set boolean parameter to default value (true) when called without arguments', () => {
      builder.enableFlag();
      expect(builder['params'].flag).toBe(true);
    });

    it('should set boolean parameter to specified value', () => {
      builder.enableFlag(false);
      expect(builder['params'].flag).toBe(false);
    });

    it('should use custom default value', () => {
      builder.setFlag();
      expect(builder['params'].flag).toBe(false);
    });

    it('should override custom default with specified value', () => {
      builder.setFlag(true);
      expect(builder['params'].flag).toBe(true);
    });

    it('should support method chaining', () => {
      const result = builder.enableFlag();
      expect(result).toBe(builder);
    });
  });

  describe('createStringMethod', () => {
    it('should set string parameter', () => {
      builder.setText('hello world');
      expect(builder['params'].text).toBe('hello world');
    });

    it('should handle empty strings', () => {
      builder.setText('');
      expect(builder['params'].text).toBe('');
    });

    it('should support method chaining', () => {
      const result = builder.setText('test');
      expect(result).toBe(builder);
    });
  });

  describe('createArrayMethod', () => {
    it('should set array parameter', () => {
      builder.setItems(['item1', 'item2', 'item3']);
      expect(builder['params'].items).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle empty arrays', () => {
      builder.setItems([]);
      expect(builder['params'].items).toEqual([]);
    });

    it('should support method chaining', () => {
      const result = builder.setItems(['test']);
      expect(result).toBe(builder);
    });
  });

  describe('createOptionalStringMethod', () => {
    it('should set parameter when value is provided', () => {
      builder.setOptional('value');
      expect(builder['params'].optional).toBe('value');
    });

    it('should handle empty strings', () => {
      builder.setOptional('');
      expect(builder['params'].optional).toBe('');
    });

    it('should not set parameter when value is undefined', () => {
      builder.setOptional(undefined);
      expect(builder['params'].optional).toBeUndefined();
    });

    it('should not set parameter when called without arguments', () => {
      builder.setOptional();
      expect(builder['params'].optional).toBeUndefined();
    });

    it('should support method chaining when value is provided', () => {
      const result = builder.setOptional('test');
      expect(result).toBe(builder);
    });

    it('should support method chaining when value is not provided', () => {
      const result = builder.setOptional();
      expect(result).toBe(builder);
    });
  });

  describe('complex usage', () => {
    it('should support combining multiple parameter helpers', () => {
      builder.enableFlag().setText('hello').setItems(['a', 'b']).setOptional('maybe').setFlag(true);

      expect(builder['params']).toEqual({
        flag: true,
        text: 'hello',
        items: ['a', 'b'],
        optional: 'maybe',
      });
    });

    it('should execute with all parameters', async () => {
      await builder.enableFlag(false).setText('test').setItems(['1', '2', '3']).execute();

      expect(executor).toHaveBeenCalledWith({
        flag: false,
        text: 'test',
        items: ['1', '2', '3'],
      });
    });
  });
});
