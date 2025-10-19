---
'sonarqube-web-api-client': patch
---

Improve code quality by fixing 172 SonarQube issues

Fixed all SonarQube code quality issues including:

- Replaced `.forEach()` with `for...of` loops for better performance
- Modernized to use `Number.parseInt` and `Number.isNaN`
- Improved promise handling patterns (replaced `Promise.resolve()`/`Promise.reject()` with direct returns/throws)
- Updated to `String.fromCodePoint` for Unicode safety
- Added type annotations for better type safety

All changes maintain existing behavior while improving code quality, performance, and maintainability.
