---
'sonarqube-web-api-client': patch
---

Migrate to ES2022 and Node16 module resolution

Updated TypeScript configuration to use ES2022 target and Node16 module resolution for better ESM support and modern JavaScript features:

**Configuration Changes:**

- Updated `target` from ES2021 to ES2022
- Updated `module` to Node16 for proper ESM support
- Updated `lib` to ES2022 for modern JavaScript APIs
- Updated `moduleResolution` to Node16

**Code Changes:**

- Added explicit `.js` extensions to all relative imports (312 files) as required by Node16 module resolution
- Updated directory imports to use `/index.js` explicitly
- Refactored `NetworkError` to use native `Error.cause` mechanism from ES2022
- Updated test configuration to use CommonJS for backward compatibility

**Benefits:**

- Better ESM/CommonJS interoperability
- Access to modern JavaScript features (e.g., native Error.cause)
- Improved module resolution semantics
- More explicit import paths following Node.js ESM standards

All changes are internal build and type improvements. The public API remains unchanged with 100% backward compatibility.
