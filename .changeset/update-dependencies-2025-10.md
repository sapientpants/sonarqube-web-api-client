---
'sonarqube-web-api-client': patch
---

chore: update dependencies to latest versions

Updated production and dev dependencies to their latest versions:

Production dependencies:

- pino: 9.10.0 → 10.0.0 (major update with improved performance)
- pino-roll: 3.1.0 → 4.0.0 (major update for compatibility with pino 10)
- zod: 4.1.9 → 4.1.12 (patch updates)

Dev dependencies:

- @commitlint/cli: 19.8.1 → 20.1.0
- @commitlint/config-conventional: 19.8.1 → 20.0.0
- @cyclonedx/cdxgen: 11.7.0 → 11.9.0
- @types/node: 24.5.1 → 24.7.2
- @typescript-eslint/eslint-plugin: 8.44.0 → 8.46.0
- @typescript-eslint/parser: 8.44.0 → 8.46.0
- eslint: 9.35.0 → 9.37.0
- eslint-plugin-jsonc: 2.20.1 → 2.21.0
- jsonc-eslint-parser: 2.4.0 → 2.4.1
- lint-staged: 16.1.6 → 16.2.4
- pino-pretty: 13.1.1 → 13.1.2
- typescript: 5.9.2 → 5.9.3
- vite: 7.1.5 → 7.1.9

All tests passing with 80%+ coverage maintained. No breaking changes to public API.
