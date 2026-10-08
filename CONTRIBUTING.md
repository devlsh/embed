# Contributing

Read the [Code of Conduct](CODE_OF_CONDUCT.md) before you participate.

## Questions And Reports

Use [GitHub Discussions](https://github.com/devlsh/embed/discussions) for questions and support, and [Issues](https://github.com/devlsh/embed/issues) for bugs and feature requests. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

Search open and closed issues first. Add details to a report, or open a new one with reproduction steps, expected and actual behavior, and environment details.

## Local Development

Install [Nix](https://nix.dev/) and [devenv](https://devenv.sh/), then clone the repository.

From the repository root, install dependencies with the frozen lockfile and set up Git hooks:

```sh
devenv tasks run embed:install
```

Enter the development shell before you run the pnpm commands below:

```sh
devenv shell
```

If you use [direnv](https://direnv.net/), run `direnv allow .` instead of manual shell activation.

## Dependency Changes

Ask the maintainer to approve dependency versions before you add or update them. Include the manifest, lockfile, and related script or configuration changes in the same PR.

## Checks

Run library and test typechecks, lint checks, and formatting checks:

```sh
pnpm check
```

`pnpm check` does not run tests, demo typechecks, or builds. The [root TypeScript configuration](tsconfig.json) does not check fixture SFC scripts, templates, or component props.

Apply automatic lint and formatting fixes when needed:

```sh
pnpm fix:all
```

Inspect the diff, correct remaining findings, and rerun `pnpm check` until it passes. For documentation changes, check local links and anchors too.

For behavior changes, add or update public-consumer tests and run the Vue Vitest suite:

```sh
pnpm test
```

The suite uses real iframe messages in Chromium for same-origin and cross-origin connections. The demo is a reference, not a test target. Static checks do not prove runtime behavior.

`pnpm test`, `pnpm test:watch`, and `pnpm test:coverage` first install Chromium for the current Playwright version. Use `pnpm test:setup` for separate installation or missing-browser recovery.

`pnpm test:coverage` writes library-source coverage to `coverage/`. Vitest V8 omits child-origin counters for cross-origin iframes. Cross-origin tests verify behavior. Same-origin variants supply source coverage for those child paths.

Run `pnpm build` when changes need generated package output or built-package consumer checks.

For demo changes, run these additional checks from the repository root:

```sh
pnpm demo typecheck
pnpm demo build
```

After the demo build, validate deployment packaging without live deployment:

```sh
pnpm demo wrangler deploy --dry-run
```

Demo typechecks use `vue-tsc` for SFCs and browser TypeScript, then `tsc` for Vite configuration. Preserve the [demo-local compiler pair](demo/package.json) and [strict template checks](demo/tsconfig.json).

Read the [demo guide](demo/README.md) for controls. Library checks do not replace demo checks.

## Pull Requests

Search existing issues and PRs first. Keep changes focused, and update affected tests and usage examples.

- Open a PR against `main` with the [PR template](.github/PULL_REQUEST_TEMPLATE.md). Use a Conventional Commit title for release-relevant changes.
- Explain the change, link related issues, and identify breaking changes or areas that need review.
- List checks run and their results. Explain omitted tests or blocked checks.
- Use a draft for unfinished work. Request final review after local and required CI checks pass and blocking findings are resolved.
- If you use AI, write the description in your own words and explain how you reviewed its code and decisions.
