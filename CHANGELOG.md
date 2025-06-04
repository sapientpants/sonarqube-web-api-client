# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.1] - 2025-06-04

### Security
- Fixed potential ReDoS vulnerability in `ruleKeyUtils.generateKey()` by replacing regex-based hyphen removal with a more efficient approach

### Fixed
- Resolved various SonarQube code quality issues
- Fixed regex operator precedence in clean-code-policy utils

### Changed
- Improved test coverage to meet 85% minimum requirement

## [0.9.0] - Previous releases
- Initial release with comprehensive SonarQube Web API client implementation