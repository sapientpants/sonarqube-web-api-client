// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import {
  AlmSettingsBuilderWithOAuth,
  AlmSettingsBuilderWithKey,
  UpdatableAlmSettingsBuilder,
  UpdatableAlmSettingsBuilderWithKey,
  ProjectBindingBuilder,
} from '../../../../src/core/builders/AlmSettingsBuilder.js';

// Test implementation of AlmSettingsBuilderWithOAuth
interface TestOAuthRequest {
  clientId?: string;
  clientSecret?: string;
  url?: string;
}

class TestAlmSettingsBuilderWithOAuth extends AlmSettingsBuilderWithOAuth<TestOAuthRequest> {
  async execute(): Promise<void> {
    return this.executor(this.params as TestOAuthRequest);
  }
}

// Test implementation of AlmSettingsBuilderWithKey
interface TestKeyRequest {
  key?: string;
  clientId?: string;
  clientSecret?: string;
  url?: string;
}

class TestAlmSettingsBuilderWithKey extends AlmSettingsBuilderWithKey<TestKeyRequest> {
  async execute(): Promise<void> {
    return this.executor(this.params as TestKeyRequest);
  }
}

// Test implementation of UpdatableAlmSettingsBuilder
interface TestUpdatableRequest {
  clientId?: string;
  clientSecret?: string;
  newKey?: string;
  url?: string;
}

class TestUpdatableAlmSettingsBuilder extends UpdatableAlmSettingsBuilder<TestUpdatableRequest> {
  async execute(): Promise<void> {
    return this.executor(this.params as TestUpdatableRequest);
  }
}

// Test implementation of UpdatableAlmSettingsBuilderWithKey
interface TestUpdatableKeyRequest {
  key?: string;
  clientId?: string;
  clientSecret?: string;
  newKey?: string;
  url?: string;
}

class TestUpdatableAlmSettingsBuilderWithKey extends UpdatableAlmSettingsBuilderWithKey<TestUpdatableKeyRequest> {
  async execute(): Promise<void> {
    return this.executor(this.params as TestUpdatableKeyRequest);
  }
}

// Test implementation of ProjectBindingBuilder
interface TestProjectBindingRequest {
  project?: string;
  almSetting?: string;
  monorepo?: boolean;
  repository?: string;
  slug?: string;
}

class TestProjectBindingBuilder extends ProjectBindingBuilder<TestProjectBindingRequest> {
  async execute(): Promise<void> {
    return this.executor(this.params as TestProjectBindingRequest);
  }
}

describe('AlmSettingsBuilderWithOAuth', () => {
  let executor: Mock;
  let builder: TestAlmSettingsBuilderWithOAuth;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestAlmSettingsBuilderWithOAuth(executor);
  });

  describe('withOAuth', () => {
    it('should set OAuth credentials', () => {
      builder.withOAuth('my-client-id', 'my-client-secret');
      expect(builder['params'].clientId).toBe('my-client-id');
      expect(builder['params'].clientSecret).toBe('my-client-secret');
    });

    it('should support method chaining', () => {
      const result = builder.withOAuth('id', 'secret');
      expect(result).toBe(builder);
    });

    it('should execute with OAuth credentials', async () => {
      await builder.withOAuth('client-123', 'secret-456').execute();

      expect(executor).toHaveBeenCalledWith({
        clientId: 'client-123',
        clientSecret: 'secret-456',
      });
    });
  });
});

describe('AlmSettingsBuilderWithKey', () => {
  let executor: Mock;
  let builder: TestAlmSettingsBuilderWithKey;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestAlmSettingsBuilderWithKey(executor, 'my-alm-key');
  });

  it('should initialize with key', () => {
    expect(builder['params'].key).toBe('my-alm-key');
  });

  describe('withOAuth', () => {
    it('should set OAuth credentials while preserving key', () => {
      builder.withOAuth('client-id', 'client-secret');
      expect(builder['params']).toMatchObject({
        key: 'my-alm-key',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      });
    });

    it('should execute with all parameters', async () => {
      await builder.withOAuth('client-123', 'secret-456').execute();

      expect(executor).toHaveBeenCalledWith({
        key: 'my-alm-key',
        clientId: 'client-123',
        clientSecret: 'secret-456',
      });
    });
  });
});

describe('UpdatableAlmSettingsBuilder', () => {
  let executor: Mock;
  let builder: TestUpdatableAlmSettingsBuilder;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestUpdatableAlmSettingsBuilder(executor);
  });

  describe('withNewKey', () => {
    it('should set new key', () => {
      builder.withNewKey('new-key-123');
      expect(builder['params'].newKey).toBe('new-key-123');
    });

    it('should support method chaining', () => {
      const result = builder.withNewKey('new-key');
      expect(result).toBe(builder);
    });

    it('should execute with all parameters', async () => {
      await builder.withOAuth('client-id', 'client-secret').withNewKey('new-key-456').execute();

      expect(executor).toHaveBeenCalledWith({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        newKey: 'new-key-456',
      });
    });
  });
});

describe('UpdatableAlmSettingsBuilderWithKey', () => {
  let executor: Mock;
  let builder: TestUpdatableAlmSettingsBuilderWithKey;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestUpdatableAlmSettingsBuilderWithKey(executor, 'existing-key');
  });

  it('should initialize with key', () => {
    expect(builder['params'].key).toBe('existing-key');
  });

  describe('withNewKey', () => {
    it('should set new key while preserving existing key', () => {
      builder.withNewKey('updated-key');
      expect(builder['params']).toMatchObject({
        key: 'existing-key',
        newKey: 'updated-key',
      });
    });

    it('should execute with all parameters', async () => {
      await builder.withOAuth('client-id', 'client-secret').withNewKey('updated-key-123').execute();

      expect(executor).toHaveBeenCalledWith({
        key: 'existing-key',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        newKey: 'updated-key-123',
      });
    });
  });
});

describe('ProjectBindingBuilder', () => {
  let executor: Mock;
  let builder: TestProjectBindingBuilder;

  beforeEach(() => {
    executor = vi.fn();
    builder = new TestProjectBindingBuilder(executor, 'my-project', 'my-alm-setting');
  });

  it('should initialize with project and almSetting', () => {
    expect(builder['params'].project).toBe('my-project');
    expect(builder['params'].almSetting).toBe('my-alm-setting');
  });

  describe('asMonorepo', () => {
    it('should enable monorepo by default', () => {
      builder.asMonorepo();
      expect(builder['params'].monorepo).toBe(true);
    });

    it('should allow disabling monorepo', () => {
      builder.asMonorepo(false);
      expect(builder['params'].monorepo).toBe(false);
    });

    it('should support method chaining', () => {
      const result = builder.asMonorepo();
      expect(result).toBe(builder);
    });
  });

  describe('withRepository', () => {
    it('should set repository', () => {
      builder.withRepository('org/repo');
      expect(builder['params'].repository).toBe('org/repo');
    });

    it('should support method chaining', () => {
      const result = builder.withRepository('repo');
      expect(result).toBe(builder);
    });
  });

  describe('execute', () => {
    it('should execute with minimal parameters', async () => {
      await builder.execute();

      expect(executor).toHaveBeenCalledWith({
        project: 'my-project',
        almSetting: 'my-alm-setting',
      });
    });

    it('should execute with all parameters', async () => {
      await builder.asMonorepo().withRepository('org/monorepo').execute();

      expect(executor).toHaveBeenCalledWith({
        project: 'my-project',
        almSetting: 'my-alm-setting',
        monorepo: true,
        repository: 'org/monorepo',
      });
    });
  });

  describe('method chaining', () => {
    it('should support fluent interface', () => {
      const result = builder
        .withRepository('my-repo')
        .asMonorepo(false)
        .withRepository('updated-repo');

      expect(result).toBe(builder);
      expect(builder['params']).toMatchObject({
        project: 'my-project',
        almSetting: 'my-alm-setting',
        monorepo: false,
        repository: 'updated-repo',
      });
    });
  });
});
