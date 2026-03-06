// Fetch helpers including support for JSON with // comments (JSONC)

export async function fetchJSONC<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const text = await res.text()
  const cleaned = stripJSONComments(text)
  return JSON.parse(cleaned) as T
}

export function stripJSONComments(input: string) {
  let output = ''
  let i = 0
  let inString = false
  let escaped = false

  while (i < input.length) {
    const cur = input[i]
    const next = input[i + 1]

    if (inString) {
      output += cur
      if (escaped) {
        escaped = false
      } else if (cur === '\\') {
        escaped = true
      } else if (cur === '"') {
        inString = false
      }
      i += 1
      continue
    }

    if (cur === '"') {
      inString = true
      output += cur
      i += 1
      continue
    }

    // Line comment: // ...
    if (cur === '/' && next === '/') {
      i += 2
      while (i < input.length && input[i] !== '\n') i += 1
      continue
    }

    // Block comment: /* ... */
    if (cur === '/' && next === '*') {
      i += 2
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1
      i += 2
      continue
    }

    output += cur
    i += 1
  }

  return output
}

export async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
