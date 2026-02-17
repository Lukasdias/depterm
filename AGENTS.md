# Agent Guidelines for depterm

## Project Overview

depterm is a terminal UI for managing JavaScript/TypeScript dependencies. It uses Bun runtime, OpenTUI for rendering, and TypeScript with strict mode.

## Commands

```bash
# Install dependencies
bun install

# Run development
bun dev

# Type check
bun run typecheck

# Build for production
bun run build

# Compile to standalone binary
bun run compile
```

## Code Style

### TypeScript

- Strict mode enabled - no `any` types allowed
- Use explicit return types for exported functions
- Interface over type for public APIs

### Imports

- Use `.js` extension for local imports: `import { foo } from './foo.js'`
- Group imports: external libs → types → local modules
- Use absolute imports from package root: `import { Type } from '../types/index.js'`

### Naming

- PascalCase for types, interfaces, classes
- camelCase for variables, functions
- SCREAMING_SNAKE_CASE for constants
- Prefix interfaces with `I` only when necessary (avoid: `IUser`, prefer: `User`)

### Functions

- Use async/await over promise chains
- Prefer early returns over nested conditionals
- Keep functions under 50 lines

### Error Handling

- Use try/catch for async operations
- Throw descriptive errors: `throw new Error(\`Failed to X: \${reason}\`)`
- Never swallow errors silently without logging

### State Management

- Centralized state in `src/ui/state.ts`
- Use Maps for keyed collections
- Avoid mutating state directly; update and re-render

### UI Components

- OpenTUI renderables (BoxRenderable, TextRenderable)
- Return BoxRenderable from component functions
- Pure functions - no side effects in render functions
- Use constants for colors (defined in `src/ui/colors.ts`)

### File Organization

```
src/
├── core/           # Business logic (no UI deps)
│   ├── detect-manager.ts
│   ├── read-package.ts
│   ├── outdated.ts
│   ├── conflicts.ts
│   ├── upgrade.ts
│   └── package-info.ts
├── ui/             # UI layer
│   ├── state.ts
│   ├── dashboard.ts
│   ├── colors.ts
│   ├── spinner.ts
│   └── components/
│       ├── header.ts
│       ├── left-panel.ts
│       ├── right-panel.ts
│       └── footer.ts
├── types/
│   └── index.ts
└── index.ts        # Entry point
```

## Testing

Core modules are designed for isolated testing:

```typescript
import { detectPackageManager } from './src/core/detect-manager.js';
import { readPackageJson } from './src/core/read-package.js';

detectPackageManager('./my-project').then(console.log);
readPackageJson('./my-project').then(console.log);
```

## Common Patterns

### Keyboard Input

```typescript
renderer.keyInput.on("keypress", async (key) => {
  const keyName = key.name || key.sequence;
  // handle keyName
});
```

### State Updates

```typescript
state.someValue = newValue;
renderDashboard(); // Always re-render after state change
```

### Async Fetch with Loading State

```typescript
state.loading.add(item);
fetchData(item)
  .then(data => { state.data.set(item, data); })
  .finally(() => {
    state.loading.delete(item);
    renderDashboard();
  });
```
