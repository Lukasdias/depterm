# pkg-tui

Terminal UI for managing JavaScript/TypeScript dependencies.

## Overview

pkg-tui provides a visual interface for managing project dependencies directly from the terminal. It detects package managers, identifies outdated packages, detects conflicts, and enables interactive upgrades.

## Features

- Package Manager Detection: bun, pnpm, yarn, or npm based on lockfile
- Outdated Package Detection: shows available updates by semver type
- Conflict Analysis: peer dependency issues and deprecated packages
- Interactive Upgrades: keyboard shortcuts for navigation and upgrades
- Safe Mode: blocks major version upgrades by default

## Installation

```bash
# npm
npm install -g pkg-tui

# yarn
yarn global add pkg-tui

# pnpm
pnpm add -g pkg-tui

# bun
bun add -g pkg-tui
```

## Usage

```bash
pkg-tui
```

Or without installing:

```bash
npx pkg-tui
bunx pkg-tui
```

## Controls

### Dashboard

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate packages |
| `Tab` | Switch to action mode |
| `P` | Patch upgrade (in action mode) |
| `M` | Minor upgrade (in action mode) |
| `J` | Major upgrade (in action mode) |
| `L` | Latest upgrade (in action mode) |
| `D` | Dry run (in action mode) |
| `R` | Refresh package data |
| `S` | Toggle safe mode |
| `Q` | Quit |

## Safe Mode

Enabled by default. Blocks major version upgrades. Press `S` to toggle.

## Architecture

```
pkg-tui/
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
