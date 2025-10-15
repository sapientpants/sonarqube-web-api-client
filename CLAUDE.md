# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

See [README.md](./README.md) for the complete project overview, features, and usage documentation.

## Memories

- Use puppeteer to read v1 SonarQube Web API documentation at <https://next.sonarqube.com/sonarqube/web_api>
- Use puppeteer to read v2 SonarQube Web API documentation at <https://next.sonarqube.com/sonarqube/web_api_v2>
- Do not try to run integration tests, they need to be run manually

## Development Commands

See the [Development section in README.md](./README.md#🛠️-development) for all available commands.

## Architecture Decision Records (ADRs)

This project uses adr-tools to document architectural decisions. ADRs are stored in `doc/architecture/decisions/`.

```bash
# Create a new ADR without opening an editor (prevents timeout in Claude Code)
EDITOR=true adr-new "Title of the decision"

# Then edit the created file manually
```

## Architecture

### Key Files

- `src/index.ts` - Main entry point with the SonarQubeClient class
- `src/__tests__/` - Test files
- `dist/` - Built output (gitignored)

### Technology Stack

See the [Architecture section in README.md](./README.md#🏗️-architecture) for the technology stack details.

### Architectural Decisions

All architectural decisions are documented in Architecture Decision Records (ADRs) located in
`doc/architecture/decisions/`. These ADRs are the single source of truth for understanding the design and architecture
of this library.

Refer to the ADRs for detailed information about design rationale, implementation details, and consequences of each
architectural decision.

## Integration Testing

See the [Integration Testing section in README.md](./README.md#🧪-integration-testing) for setup instructions and
configuration options.

For detailed implementation documentation, see `src/__integration__/README.md`.

## Code Quality Conventions

Follow these conventions to maintain code quality:

### TypeScript Best Practices

1. **Use Type Aliases for Union Types**

   ```typescript
   // ❌ Avoid repeated union types
   function foo(param: 'option1' | 'option2' | 'option3') {}
   function bar(param: 'option1' | 'option2' | 'option3') {}

   // ✅ Use type alias
   type MyOptions = 'option1' | 'option2' | 'option3';
   function foo(param: MyOptions) {}
   function bar(param: MyOptions) {}
   ```

2. **Use Nullish Coalescing Operator**

   ```typescript
   // ❌ Avoid logical OR for defaults (can fail with falsy values)
   const value = input || 'default';

   // ✅ Use nullish coalescing (only replaces null/undefined)
   const value = input ?? 'default';
   ```

3. **Use Object Spread Instead of Object.assign**

   ```typescript
   // ❌ Avoid Object.assign
   const merged = Object.assign({}, obj1, obj2);

   // ✅ Use object spread
   const merged = { ...obj1, ...obj2 };
   ```

4. **Avoid Deprecated APIs**
   - Check for deprecation warnings in the IDE
   - Use recommended replacements (e.g., `getHealthV2()` instead of `health()`)
   - Update to newer API versions when available

### Code Complexity

1. **Keep Cognitive Complexity Low**
   - Maximum cognitive complexity: 15
   - Break complex functions into smaller, focused functions
   - Reduce nesting levels
   - Simplify conditional logic

2. **Remove Redundant Code**
   - Don't create type aliases for primitive types
   - Remove unused variable assignments
   - Eliminate dead code

### Regular Expressions

1. **Make Regex Operator Precedence Explicit**

   ```typescript
   // ❌ Ambiguous precedence
   /abc|def+/

   // ✅ Clear precedence with grouping
   /abc|(def+)/
   ```

### General Guidelines

1. **Follow Existing Patterns**
   - Check how similar functionality is implemented in the codebase
   - Maintain consistency with existing code style
   - Use the same libraries and utilities as the rest of the project

2. **Run Validation Before Committing**

   ```bash
   # Run all checks before committing
   pnpm run ci

   # This includes:
   # - Format checking (prettier)
   # - Linting (eslint)
   # - Type checking (tsc)
   # - Tests
   ```

## Claude-Specific Tips

- Remember to use the ADR creation command with `EDITOR=true` to prevent timeouts in Claude Code
- Never use `--no-verify` when committing code. This bypasses pre-commit hooks which run important validation checks
- Run `pnpm format && pnpm lint:fix` to format code and try to fix linting issues before committing
- Run `pnpm run ci` before finalizing any code changes
