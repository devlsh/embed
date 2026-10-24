# Embed Demo

Use [Development](../docs/development.md) for demo work.

## Owners And Scope

- [src/App.vue](src/App.vue) owns default parent and `child` query selection. [src/parent/Parent.vue](src/parent/Parent.vue) composes two isolated channels.
- Keep host behavior, iframe references, requests, tips, and cleanup in [src/parent/Channel.vue](src/parent/Channel.vue). Keep client behavior in [src/child/Child.vue](src/child/Child.vue). These components import library source, not package output.
- [package.json](package.json), [vite.config.ts](vite.config.ts), and the TypeScript configs own local commands and build configuration.
- [wrangler.jsonc](wrangler.jsonc) owns deployment configuration. [demo.yml](../.github/workflows/demo.yml) owns credential-free validation and main-only deployment through `production`. Local work does not authorize live deployment or prove hosted readiness.

Update these instructions and [README.md](README.md) when owners, commands, or interface behavior change.

## Checks

Use [CONTRIBUTING](../CONTRIBUTING.md#checks) for setup and static demo checks. Include these checks for affected behavior:

- For compiler changes, verify valid standalone TypeScript and library imports pass through `pnpm demo typecheck`, and invalid TypeScript fails. The browser check uses the shared [Vue shim](../shim.d.ts); it does not check SFC scripts, templates, or component props. The demo build compiles SFCs but does not prove their type safety.
- From the repository root, run `pnpm demo dev` for real-interface checks. Verify default/query selection, isolated channels, sync integers, the five-second async payload/countdown/result, error rejection, and parent tips. Inspect pending-control recovery, the two-column layout, viewport changes, and timer/context cleanup on unmount and HMR as affected.

Library checks and a successful demo build do not prove browser behavior. Report actual commands, outcomes, and coverage gaps. Local checks do not verify DNS, custom-domain ownership, secrets, or hosted environment protection.
