// @ts-nocheck
import * as componentExports from '../../../../src/index';

describe.skip('components module exports', () => {
  it('should export ComponentsClient', () => {
    expect(componentExports.ComponentsClient).toBeDefined();
  });

  it('should export ComponentsTreeBuilder', () => {
    expect(componentExports.ComponentsTreeBuilder).toBeDefined();
  });

  it('should export all types', () => {
    // Check that types are accessible (TypeScript will verify they exist at compile time)
    const typeChecks = {
      ComponentQualifier: componentExports.ComponentQualifier,
      ComponentTreeStrategy: componentExports.ComponentTreeStrategy,
      ComponentSortField: componentExports.ComponentSortField,
    };

    expect(typeChecks.ComponentQualifier).toBeDefined();
    expect(typeChecks.ComponentTreeStrategy).toBeDefined();
    expect(typeChecks.ComponentSortField).toBeDefined();
  });
});
