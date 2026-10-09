import config from '../vite.config.js'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
const requests = []

export default {
  ...config,
  plugins: [...config.plugins, {
    name: 'avatar-regression-fixture',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/__avatar-regression/')) return next()
        if (req.url === '/__avatar-regression/results') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(requests))
          return
        }
        requests.push(req.url)
        const recovered = req.url.includes('nt_avatar_retry=') || req.url.includes('/recovered.png')
        res.statusCode = recovered ? 200 : 404
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Content-Type', recovered ? 'image/png' : 'text/plain')
        res.end(recovered ? png : 'Simulated cached failure')
      })
    },
  }],
}
