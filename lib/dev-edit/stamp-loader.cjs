// Dev-only Turbopack loader (wired in next.config.mjs): stamps every native
// JSX element with data-src="rel/path.tsx:line:column" — the opening tag's
// position in the source — so the Cmd+E edit mode (components/dev-edit) can
// map a DOM element back to the line that renders it. Components and
// fragments are skipped: the stamp has to land on the DOM element itself.
// Never runs in `next build`.
const path = require("path")
const { parse } = require("@babel/parser")
const MagicString = require("magic-string").default

const SKIP_KEYS = new Set(["loc", "range", "extra", "comments", "leadingComments", "trailingComments"])

function walk(node, visit) {
  if (!node || typeof node.type !== "string") return
  visit(node)
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue
    const value = node[key]
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visit)
    } else if (value && typeof value === "object") {
      walk(value, visit)
    }
  }
}

module.exports = function stampLoader(source, inputMap) {
  const root = this.rootContext || process.cwd()
  const file = path.relative(root, this.resourcePath).split(path.sep).join("/")
  let ast
  try {
    ast = parse(source, { sourceType: "module", plugins: ["jsx", "typescript"], errorRecovery: true })
  } catch {
    // Leave a file the parser can't read untouched — the compiler reports it.
    this.callback(null, source, inputMap)
    return
  }
  const s = new MagicString(source)
  walk(ast.program, node => {
    if (node.type !== "JSXOpeningElement") return
    const name = node.name
    if (name.type !== "JSXIdentifier" || !/^[a-z]/.test(name.name)) return
    const { line, column } = node.loc.start
    s.appendLeft(name.end, ` data-src="${file}:${line}:${column}"`)
  })
  this.callback(
    null,
    s.toString(),
    s.generateMap({ hires: true, source: this.resourcePath, includeContent: true })
  )
}
