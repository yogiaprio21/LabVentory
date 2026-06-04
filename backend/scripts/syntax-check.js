const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const files = []

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(abs)
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.js')) files.push(abs)
  }
}

walk(path.join(root, 'src'))
walk(path.join(root, 'scripts'))
walk(path.join(root, 'prisma'))

for (const file of files) {
  require('child_process').execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
}

console.log(`Syntax check passed (${files.length} files).`)
