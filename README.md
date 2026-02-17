# depterm

Terminal UI for managing JavaScript/TypeScript dependencies.

## Overview

depterm provides a visual interface for managing project dependencies directly from the terminal. It detects package managers, identifies outdated packages, detects conflicts, and enables interactive upgrades.

## Features

- Package Manager Detection: bun, pnpm, yarn, or npm based on lockfile
- Outdated Package Detection: shows available updates by semver type
- Conflict Analysis: peer dependency issues and deprecated packages
- Interactive Upgrades: single or batch upgrades with keyboard shortcuts
- Safe Mode: blocks major version upgrades by default
- Search/Filter: quickly find packages by name
- Package Info: npm metadata (description, author, license)

## Installation

```bash
# npm
npm install -g depterm

# yarn
yarn global add depterm

# pnpm
pnpm add -g depterm

# bun
bun add -g depterm
```

## Usage

```bash
depterm
```

Or without installing:

```bash
npx depterm
bunx depterm
```

## Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate packages |
| `Space` | Toggle package selection |
| `A` | Select all outdated packages |
| `C` | Clear selection |
| `B` | Batch upgrade selected packages |
| `Enter` | Open upgrade dialog |
| `Esc` | Close dialog / Clear filter |
| `/` | Start filter mode |
| `R` | Refresh package data |
| `S` | Toggle safe mode |
| `Q` | Quit |

## Safe Mode

Enabled by default. Blocks major version upgrades. Press `S` to toggle.

## Architecture

```
depterm/
├── src/
│   ├── core/           # Business logic
│   │   ├── detect-manager.ts
│   │   ├── read-package.ts
│   │   ├── outdated.ts
│   │   ├── conflicts.ts
│   │   ├── upgrade.ts
│   │   └── package-info.ts
│   ├── ui/             # UI layer
│   │   ├── state.ts
│   │   ├── dashboard.ts
│   │   ├── colors.ts
│   │   ├── spinner.ts
│   │   └── components/
│   │       ├── header.ts
│   │       ├── left-panel.ts
│   │       ├── right-panel.ts
│   │       └── footer.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Requirements

- Bun >= 1.0.0
- Node.js >= 18
- One of: npm, yarn, pnpm, or bun

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Type check
bun run typecheck

# Build for production
bun run build

# Compile to standalone binary
bun run compile
```

## Testing

Core logic is testable in isolation:

```typescript
import { detectPackageManager } from './src/core/detect-manager.js';
import { readPackageJson } from './src/core/read-package.js';

detectPackageManager('./my-project').then(console.log);
readPackageJson('./my-project').then(console.log);
```

## License

MIT
