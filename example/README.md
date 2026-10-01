# Embed Example

The directories `parent` and `child` contain an example of using `@devlsh/embed` as an ES Module via Vite with TypeScript and Vue 3
`script setup` support.

## Installing

Install the workspace from the repository root. Both examples depend on the local `@devlsh/embed` workspace package:

```sh
pnpm dlx --package=pnpm@8.15.9 pnpm install --frozen-lockfile --ignore-scripts
```

## Running

Build the library from the repository root:

```sh
pnpm dlx --package=pnpm@8.15.9 pnpm run build
```

Start each example in a separate terminal from the repository root:

```sh
pnpm dlx --package=pnpm@8.15.9 pnpm --dir example/parent dev
pnpm dlx --package=pnpm@8.15.9 pnpm --dir example/child dev
```

Navigate to `http://localhost:8000` to see the parent window.
