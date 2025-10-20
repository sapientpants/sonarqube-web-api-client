---
'sonarqube-web-api-client': major
---

**BREAKING CHANGE**: Transition to ESM-only build and consolidate TypeScript configurations

This release removes CommonJS build output and simplifies the TypeScript configuration structure. The package now provides only ESM exports.

**Breaking Changes:**

- **ESM-only**: Package now only provides ESM exports (no CommonJS)
  - Users must use ESM imports: `import { SonarQubeClient } from 'sonarqube-web-api-client'`
  - CommonJS `require()` is no longer supported
  - Requires Node.js 16+ with ESM support

**Configuration Changes:**

- Removed redundant TypeScript config files (`tsconfig.build.json`, `tsconfig.scripts.json`, `tsconfig.test.json`)
- Consolidated test configuration into `tsconfig.tests.json` extending base config
- Updated tsup configuration to build ESM format only
- Updated build target to ES2022
- Updated ESLint configuration to reference only remaining tsconfig files

**Benefits:**

- Simplified configuration with fewer files to maintain
- Aligned with modern JavaScript ecosystem (ESM-first)
- Reduced package complexity
- Better tree-shaking support for consumers

**Migration Guide:**

If you're using CommonJS, you'll need to migrate to ESM:

```javascript
// Before (CommonJS)
const { SonarQubeClient } = require('sonarqube-web-api-client');

// After (ESM)
import { SonarQubeClient } from 'sonarqube-web-api-client';
```

Alternatively, you can stay on v0.x if you need CommonJS support.
