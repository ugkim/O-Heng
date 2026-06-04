const fs = require('fs')
const http = require('http')
const path = require('path')

const host = '0.0.0.0'
const port = Number(process.env.PORT || 8080)
const root = path.resolve(__dirname, '..', 'dist')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

function resolveFile(requestUrl) {
  const url = new URL(requestUrl, `http://${host}:${port}`)
  const pathname = decodeURIComponent(url.pathname)

  if (pathname === '/') return path.join(root, 'index.html')

  const filePath = path.normalize(path.join(root, pathname))
  if (!filePath.startsWith(root)) return null
  if (!fs.existsSync(filePath)) return null
  if (fs.statSync(filePath).isDirectory()) return path.join(root, 'index.html')

  return filePath
}

http
  .createServer((request, response) => {
    const filePath = resolveFile(request.url)

    if (!filePath) {
      response.writeHead(404)
      response.end('Not found')
      return
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(500)
        response.end('Server error')
        return
      }

      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      })
      response.end(data)
    })
  })
  .listen(port, host)
