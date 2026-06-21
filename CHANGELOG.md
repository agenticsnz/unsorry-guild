# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project is being re-scoped from **Guild Hall** (a generic quest platform) into
**unsorry-guild**, an engagement layer for the [unsorry](https://github.com/agenticsnz/unsorry)
theorem-proving swarm. See `agenticsnz/unsorry-guild#1` for the design and `protocols.md` for
the engineering protocols this project follows.

## [Unreleased]

### Added
- Engineering protocols (`protocols.md`) referenced from `CLAUDE.md` (#2).
- ADR-020 and a `ThemeProvider` test covering the default theme.

### Changed
- Default theme is now **dark** (was `warm`); the light/warm/system toggle is retained (ADR-020, SPEC-008).
