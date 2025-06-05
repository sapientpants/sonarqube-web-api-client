# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

See [README.md](./README.md) for the complete project overview, features, and usage documentation.

## Memories

- Use puppeteer to read v1 SonarQube Web API documentation at https://next.sonarqube.com/sonarqube/web_api
- Use puppeteer to read v2 SonarQube Web API documentation at https://next.sonarqube.com/sonarqube/web_api_v2
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

All architectural decisions are documented in Architecture Decision Records (ADRs) located in `doc/architecture/decisions/`. These ADRs are the single source of truth for understanding the design and architecture of this library.

Refer to the ADRs for detailed information about design rationale, implementation details, and consequences of each architectural decision.

## Integration Testing

See the [Integration Testing section in README.md](./README.md#🧪-integration-testing) for setup instructions and configuration options.

For detailed implementation documentation, see `src/__integration__/README.md`.

## Claude-Specific Tips

- Remember to use the ADR creation command with `EDITOR=true` to prevent timeouts in Claude Code
- Integration tests must be run manually outside of Claude Code environment
- Use `jq` to read json files when analyzing test results or configuration
