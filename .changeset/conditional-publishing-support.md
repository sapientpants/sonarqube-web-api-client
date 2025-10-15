---
'sonarqube-web-api-client': patch
---

feat(ci): support conditional publishing with skipped distribution jobs

Enhanced the release workflow to allow GitHub releases to proceed successfully
when Docker or npm publishing jobs are conditionally skipped, rather than
blocking the entire release pipeline.

Changes:

- Updated create-release job condition to check if Docker/npm jobs succeeded OR were skipped
- Added workflow cancellation check for improved reliability
- Enables flexible release configurations where not all distribution channels need to be active

This allows releases to complete successfully even when optional publishing
steps (Docker to Docker Hub, npm to registry) are disabled via configuration
or missing credentials, while still creating the GitHub release with artifacts.
