// Fetch helpers including support for JSON with // comments (JSONC)

export async function fetchJSONC<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const text = await res.text()
  const cleaned = stripComments(text)
  return JSON.parse(cleaned) as T
}

function stripComments(input: string) {
  // Remove // line comments and /* block */ comments
  return input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

export async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

