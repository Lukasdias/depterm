#!/usr/bin/env bun

import { $ } from 'bun';

async function build() {
  console.log('Building depterm...');

  const result = await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    target: 'bun',
    minify: true,
    splitting: false,
    sourcemap: 'external',
  });

  if (!result.success) {
    console.error('Build failed:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  const fs = await import('fs');
  const cliPath = './dist/index.js';
  const content = fs.readFileSync(cliPath, 'utf-8');
  fs.writeFileSync(cliPath, `#!/usr/bin/env bun\n${content}`);

  await $`chmod +x ${cliPath}`;
  console.log('Build complete');
}

build().catch(console.error);
