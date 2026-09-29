import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import createMayarCheckout from './api/mayar/create-checkout.js'

const mayarDevApi = () => ({
  name: 'mayar-dev-api',
  configureServer(server: any) {
    server.middlewares.use('/api/mayar/create-checkout', async (req: any, res: any) => {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(Buffer.from(chunk))

      try {
        req.body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
      } catch {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ message: 'Payload JSON tidak valid.' }))
        return
      }

      const response = {
        status(code: number) {
          res.statusCode = code
          return response
        },
        json(payload: unknown) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
          return response
        },
      }

      await createMayarCheckout(req, response)
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [
      react(),
      tailwindcss(),
      mayarDevApi(),
    ],
  }
})
