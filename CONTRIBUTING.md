# Contributing to Embed

Embed is maintained at [devlsh/embed](https://github.com/devlsh/embed). It was originally authored by Evil Kiwi Limited;
the original attribution and GPL-3.0-only license remain unchanged.

We're always welcome to feedback, PRs and constructive criticism of our software.

## Code of Conduct

We employ the [Contributor Covenant 2.0](https://www.contributor-covenant.org/version/2/0/code_of_conduct/)
Code of Conduct for our Open Source systems. By submitting PRs, Issues or contributing towards our software
in any other means, you agree to follow the conduct laid out.

Please let us know [via Discord](https://discord.gg/3S6AKZ2GR9) if you feel someone is not doing so.

## I have a question!

Do not use the Issues section to ask questions regarding our Open Source software - instead, if you feel
comfortable using Discord, use the [existing community link](https://discord.gg/3S6AKZ2GR9). This is the historical community,
not a newly established devlsh community.

## I've found an issue with the library/software

In this case, feel free to open a [Bug Report](https://github.com/devlsh/embed/issues/new?assignees=&labels=&template=bug_report.md&title=)
and fully explain the Issue to us. If you don't explain in enough detail, it makes it much harder to diagnose.

Ideally we'd love a minimal set-up that reproduces the issue.

## I have a PR which fixes a bug/adds a new feature

Great! We'd love to see it!

- Open a PR against this repository
- Explain in detail what the PR does and why you are submitting it
- Add any additional info
  - For example, if this is a new feature, provide your fork with a working example

## Package verification

Use temporary pnpm 8.15.9 to preserve the version 6 lockfile. Install dependencies without install lifecycle scripts, then build:

```sh
pnpm dlx --package=pnpm@8.15.9 pnpm install --frozen-lockfile --ignore-scripts
pnpm dlx --package=pnpm@8.15.9 pnpm run build
```

Verify the real packed package in an isolated consumer with Vue 3.3.8 and TypeScript 5.2.2:

```sh
pnpm dlx --package=pnpm@8.15.9 pnpm test:package
```

Open the printed `BROWSER REQUIRED` loopback URL in a real browser. The script records browser results in its printed temporary evidence
directory and exits nonzero if a check fails or no browser results arrive within ten minutes. The checks cover package metadata, license,
native entrypoints, strict installed declarations, and the host/client iframe protocol. They do not publish packages.

Keep `@devlsh/logger` on the compatible 1.x API until a separate public API migration is approved. Do not substitute Logger 3.x:
`Context.logger` exposes the legacy logger, including `useLogger()` and `group(message, context?, collapsed?, level?, prefix?)`.
