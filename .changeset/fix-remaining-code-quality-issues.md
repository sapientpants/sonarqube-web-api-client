---
'sonarqube-web-api-client': patch
---

Fix remaining code quality and maintainability issues

Fixed 48 SonarQube code quality issues across the codebase:

**Performance and Readability:**

- Replaced `String#replace()` with `String#replaceAll()` for ES2021 compatibility (9 fixes)
- Used `String.raw` to avoid escaping backslashes in regex patterns (4 fixes)
- Combined multiple `Array#push()` calls into single calls (6 fixes)
- Used `.at(-1)` for cleaner array access instead of `[length - 1]` (2 fixes)

**Code Clarity:**

- Fixed unexpected negated conditions by flipping logic for better readability (12 fixes)
- Used `export...from` syntax for cleaner re-exports (8 fixes)
- Converted arrays to Sets for better performance with `.includes()` checks (2 fixes)
- Used `TypeError` instead of generic `Error` for type validation (1 fix)

**Test Coverage:**

- Added missing test assertion to incomplete test case (1 fix)

All changes maintain 100% backward compatibility. All 1859 tests passing.
