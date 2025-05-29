# Enhanced Deprecation System

This directory contains an enhanced deprecation management system that provides a superior developer experience when dealing with deprecated APIs.

## Features

### 1. Enhanced Decorators
- **`@Deprecated`**: Method-level decorator with rich metadata support
- **`@DeprecatedClass`**: Class-level deprecation
- **`@DeprecatedParameter`**: Parameter-level deprecation
- Automatic integration with TypeScript's `@deprecated` JSDoc
- Runtime warnings with migration examples
- Critical errors for APIs past removal date

### 2. Compatibility Bridge
- Automatic translation of old API calls to new ones
- Parameter and result transformation
- Transparent migration without code changes
- Proxy-based interception

### 3. Migration Assistant
- Code analysis and deprecation detection
- Automatic fix generation
- Migration effort estimation
- Detailed migration reports

### 4. Deprecation Registry
- Centralized metadata storage
- Timeline reports
- Tag-based filtering
- Export for external tooling

### 5. CLI Migration Tool
- Automatic code migration
- Dry-run mode
- Interactive and batch modes
- Progress tracking

## Usage

### Basic Deprecation

```typescript
import { Deprecated } from '@sonarqube/deprecation';

class ApiClient {
  @Deprecated({
    deprecatedSince: '1.0.0',
    removalDate: '2025-12-31',
    replacement: 'newMethod()',
    reason: 'Performance improvements in new method',
    examples: [{
      before: 'client.oldMethod(param)',
      after: 'client.newMethod(param)',
      description: 'Simple parameter passing'
    }]
  })
  oldMethod(param: string): void {
    // Implementation
  }
}
```

### Compatibility Mode

```typescript
import { withCompatibility } from '@sonarqube/deprecation';

// Wrap client with compatibility layer
const compatibleClient = withCompatibility(client, [
  {
    oldApi: 'users.search',
    newApi: 'users.searchV2',
    transformer: (oldParams) => ({
      // Transform parameters
    })
  }
]);

// Old code continues to work
compatibleClient.users.search(); // Automatically calls searchV2
```

### Migration Analysis

```typescript
import { MigrationAssistant } from '@sonarqube/deprecation';

// Analyze codebase
const report = MigrationAssistant.analyzeUsage(usageData);

// Generate migration guide
const guide = MigrationAssistant.generateMigrationGuide();
```

### CLI Tool

```bash
# Analyze project for deprecated APIs
npx sonarqube-client-migrate --dry-run

# Generate detailed report
npx sonarqube-client-migrate --report

# Apply automatic migrations
npx sonarqube-client-migrate

# Non-interactive mode for CI/CD
npx sonarqube-client-migrate --no-interactive
```

## Configuration

```typescript
import { DeprecationManager } from '@sonarqube/deprecation';

DeprecationManager.configure({
  // Suppress warnings in production
  suppressDeprecationWarnings: process.env.NODE_ENV === 'production',
  
  // Fail on deprecated usage in CI
  strictMode: process.env.CI === 'true',
  
  // Enable migration hints
  migrationMode: true,
  
  // Custom handler for monitoring
  onDeprecationWarning: (context) => {
    telemetry.track('deprecated_api_usage', {
      api: context.api,
      replacement: context.replacement
    });
  }
});
```

## Best Practices

1. **Always provide migration examples** - Show before/after code
2. **Set realistic removal dates** - Give users time to migrate
3. **Document breaking changes** - Be explicit about what changes
4. **Use semantic versioning** - Major version for removals
5. **Provide automatic migration** - When possible
6. **Monitor usage** - Track deprecated API usage in production

## Architecture

The system is built with several key components:

- **DeprecationManager**: Core warning system
- **Decorators**: TypeScript decorators for marking deprecations
- **DeprecationRegistry**: Metadata storage and querying
- **CompatibilityBridge**: Runtime API translation
- **MigrationAssistant**: Code analysis and transformation
- **CLI Tool**: Command-line migration interface

## Future Enhancements

1. **IDE Integration**: VS Code extension for inline warnings
2. **Build Tool Plugins**: Webpack/Rollup plugins for build-time checks
3. **Analytics Dashboard**: Web UI for deprecation metrics
4. **AI-Powered Migration**: Use LLMs for complex migrations
5. **Deprecation Budget**: Limit deprecated API usage per project

## Contributing

When adding new deprecations:

1. Use the `@Deprecated` decorator
2. Provide comprehensive metadata
3. Add migration examples
4. Update the registry
5. Test the compatibility bridge
6. Document in CHANGELOG

## Examples

See the `examples/` directory for real-world usage:
- `UsersApiExample.ts`: V1 to V2 migration example
- More examples coming soon...

## Testing

Run the test suite:
```bash
npm test src/core/deprecation
```

## License

Part of the SonarQube Web API Client project.