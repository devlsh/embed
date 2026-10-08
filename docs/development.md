# Development

Use [CONTRIBUTING.md](../CONTRIBUTING.md) for setup, dependency changes, checks, and pull requests. For release or recovery work, read [Releasing](releasing.md).

Before edits, inspect [package.json](../package.json), the affected implementation and tests, and their configuration. Use nearby code patterns and the configured lint and formatting rules.

## Documentation

When public behavior or scope changes, update affected [README examples](../README.md#usage) and the [demo guide](../demo/README.md). When owners or routes change, update affected instructions and links. Keep executable details in their source files.

## Agent Workflow

Select checks from [CONTRIBUTING](../CONTRIBUTING.md#checks) and [package.json](../package.json) for every affected consumer. Include behavior checks for these cases:

- For iframe transport or lifecycle changes, exercise real Vue consumers with same-origin and cross-origin messages, requests, and cleanup. Keep the test server loopback-bound and tests sequential within each file because the native render registry is shared.
- For API or compiler changes, preserve [static API contracts](../tests/types.test.ts). Root typechecks do not check fixture SFC scripts, templates, or component props.
- For demo changes, use the [scoped instructions](../demo/AGENTS.md#checks). The demo imports library source, not package output. Library checks do not replace demo or built-package consumer checks.

Scope automatic fixes and formatting to authorized files. Report changed files, outcomes, exact check commands and results, and omitted or blocked checks with their reasons.

### Tracker Operations

For tracker work, resolve the exact hosted repository and use [Questions And Reports](../CONTRIBUTING.md#questions-and-reports). Check current hosted labels before you apply them.
