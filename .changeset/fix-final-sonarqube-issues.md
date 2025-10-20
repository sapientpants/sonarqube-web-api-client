---
'sonarqube-web-api-client': patch
---

Fix final SonarQube code quality issues

Fixed 21 remaining SonarQube code quality issues to achieve zero technical debt:

**S7735 (Negated Conditions) - 2 issues:**

- Reversed negated conditional logic for improved readability

**S7780 (String.raw for Escaping) - 5 issues:**

- Used `String.raw` to avoid escaping backslashes in regex patterns

**S7778 (Array.push() Calls) - 3 issues:**

- Consolidated multiple `Array.push()` calls into single operations

**S7763 (Export from Re-export) - 6 issues:**

- Refactored type re-exports to use `export...from` syntax

**S7776 (Set Usage) - 2 issues:**

- Converted arrays to Sets for better performance with `.has()` checks

All changes are internal refactorings that maintain 100% backward compatibility with no breaking changes or API modifications.
