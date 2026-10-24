# Development

## Change Workflow

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for setup, dependency approval, standard checks, and PR procedure.
2. Identify each affected consumer using the source map below. Inspect its implementation, tests, configuration, and public usage before editing.
3. Apply the relevant validation requirements below, in addition to the standard checks. Scope automatic fixes and formatting to authorized files.
4. Report changed files and behavior, exact check commands and results, and omitted or blocked checks with reasons. Distinguish local evidence from hosted or installed-consumer evidence.

## Source And Consumer Map

| Change                            | Source and contract to inspect                                                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Messaging, requests, or lifecycle | [src/index.ts](../src/index.ts), [src/types.ts](../src/types.ts), [src/errors.ts](../src/errors.ts), and [src/utils.ts](../src/utils.ts)                                                 |
| Browser consumers                 | [tests](../tests), [tests/fixtures](../tests/fixtures), [tests/helpers/fixture.ts](../tests/helpers/fixture.ts), and [vitest.config.ts](../vitest.config.ts)                             |
| API or compiler                   | [tests/types.test.ts](../tests/types.test.ts), [tsconfig.json](../tsconfig.json), and [tsconfig.build.json](../tsconfig.build.json)                                                      |
| Build or package contents         | [tsdown.config.ts](../tsdown.config.ts), exports/files/lifecycle scripts in [package.json](../package.json), and [README examples](../README.md#usage)                                   |
| Demo                              | [demo/AGENTS.md](../demo/AGENTS.md), [demo/README.md](../demo/README.md), and [demo/package.json](../demo/package.json)                                                                  |
| Setup or workflows                | [.openchamber/project.json](../.openchamber/project.json), [lefthook.yml](../lefthook.yml), [pnpm-workspace.yaml](../pnpm-workspace.yaml), and [.github/workflows](../.github/workflows) |

- `src/index.ts` owns the shared context registry, message listener, request settlement, and `useEmbed` lifecycle. Supporting modules own public types, error transport, and request IDs.
- Browser tests mount real Vue host/client fixtures. Keep the test server loopback-bound and tests sequential within each file because the native render registry is shared.
- The demo imports library source, not package output. Its scoped instructions own component responsibilities, compiler requirements, and deployment boundaries.
- `dist` is generated. Source-local tests and the demo do not prove installed package exports or declarations.

## Validation Requirements

Select focused checks from [package.json](../package.json) during development. Complete the [standard checks](../CONTRIBUTING.md#checks) before closeout. Add evidence for each affected consumer:

| Affected surface               | Required evidence                                                                                                                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Iframe transport or lifecycle  | Exercise real Vue consumers with same-origin and cross-origin messages, requests, and cleanup through the browser suite.                                                                                                    |
| API or compiler                | Preserve static API contracts. Verify valid TypeScript passes and invalid TypeScript fails through affected commands. Respect the [typecheck scope](../CONTRIBUTING.md#checks) and [demo checks](../demo/AGENTS.md#checks). |
| Module exports or build output | Pack and install into an isolated consumer. Verify runtime imports and declarations against the exported module paths. Source-local checks do not prove the published module layout.                                        |
| Demo                           | Follow the [scoped checks](../demo/AGENTS.md#checks), including demo typechecks, build, credential-free deployment packaging, and real-interface checks as affected.                                                        |
| Shared action or workflow      | Check inputs, outputs, and caller compatibility. Local package checks do not execute GitHub Actions; report hosted execution as unverified unless an authorized run covers the change.                                      |

`pnpm check` does not run browser tests, demo typechecks, or builds. Static checks and source coverage do not replace the consumer evidence above.

## Documentation Ownership

- Keep always-loaded authorization, repository defaults, and task routes in [AGENTS.md](../AGENTS.md). Keep demo-specific instructions in its scoped owner.
- Keep shared contributor procedures in CONTRIBUTING and release operations in [Releasing](releasing.md). Link to the owner instead of copying its procedure.
- Keep public behavior and examples in the root README and demo guide. Update both when their documented behavior or scope changes.
- When instructions change, update affected routes and remove obsolete guidance in the same change. Verify local paths and anchors, and compare documented commands and claims with their executable owners.
- Check incoming links from human documentation against the audience boundary in [AGENTS.md](../AGENTS.md#repository-defaults).

## Tracker Operations

- Resolve the exact hosted repository from [package.json](../package.json) and the requested object before acting.
- Use [Questions And Reports](../CONTRIBUTING.md#questions-and-reports) for support, issue search, and private security reports.
- Read current hosted labels before applying them. Configuration files and old reports do not establish current hosted state.
