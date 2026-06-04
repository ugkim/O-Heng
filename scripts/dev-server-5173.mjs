import { createServer } from 'vite'

const server = await createServer({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})

await server.listen()
server.printUrls()

setInterval(() => {}, 24 * 60 * 60 * 1000)
