import { existsSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const cwd = process.cwd()

const fileChecks = [
  'node_modules/typescript/lib/tsc.js',
  'node_modules/vite/bin/vite.js',
  'node_modules/tailwindcss/package.json',
]

const missing = fileChecks.filter((relativePath) => !existsSync(resolve(cwd, relativePath)))

function hasFastGlobViaPnpmLayout() {
  const pnpmDir = resolve(cwd, 'node_modules/.pnpm')
  if (!existsSync(pnpmDir)) return false

  const entries = readdirSync(pnpmDir).filter((name) => name.startsWith('fast-glob@'))
  return entries.some((entry) =>
    existsSync(resolve(pnpmDir, entry, 'node_modules/fast-glob/package.json'))
  )
}

if (!hasFastGlobViaPnpmLayout()) {
  missing.push('fast-glob package (pnpm layout check failed)')
}

if (missing.length === 0) {
  console.log('[doctor] Dependency check passed.')
  process.exit(0)
}

console.error('[doctor] Dependency check failed. Missing files:')
missing.forEach((item) => console.error(`  - ${item}`))

console.error('\n[doctor] Recommended recovery commands:')
console.error('  1) rm -rf node_modules')
console.error('  2) pnpm install --frozen-lockfile')
console.error('  3) pnpm run build')

process.exit(1)
