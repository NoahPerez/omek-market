import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'
import fs from 'fs'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

const workerMode = (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" | undefined) || "shared"
const disableAdmin = process.env.DISABLE_MEDUSA_ADMIN === "true"
const isWorker = workerMode === "worker"

// Resolves where a dashboard app lives:
// - in the source tree (development): ../../apps/<name>
// - in the production build artifact: hosts that deploy only `.medusa/server` (for example
//   Medusa Cloud) get the panels bundled into ./dashboards/<name> by
//   scripts/bundle-dashboards.mjs during `build`. The compiled config runs from the
//   artifact root, so __dirname points there.
const dashboardAppDir = (name: string) => {
  const bundled = path.join(__dirname, 'dashboards', name)
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, `../../apps/${name}`)
}

const redisOptions = {
  redisUrl: REDIS_URL,
  redisOptions: {
    // Allows ioredis to handle TLS if rediss:// is used
    tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    // Prevents unhandled crash loops on connection loss
    maxRetriesPerRequest: null, 
    enableReadyCheck: false,
  },
}

module.exports = withMercur({
  projectConfig: {
   databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      connection: {
        ssl: false,
      },
    },
    redisUrl: REDIS_URL,
    workerMode,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    disable: disableAdmin,
  },
  featureFlags: {
    seller_registration: true
  },
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        disable: isWorker,
        appDir: dashboardAppDir('admin'),
        path: '/dashboard',
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        disable: isWorker,
        appDir: dashboardAppDir('vendor'),
        path: '/seller',
      }
    },
    {
      resolve: '@medusajs/medusa/cache-redis',
      options: redisOptions,
    },
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: redisOptions,
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: { redis: redisOptions },
    },
    {
      resolve: '@medusajs/medusa/locking',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/locking-redis',
            id: 'locking-redis',
            is_default: true,
            options: redisOptions,
          },
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: {
              // The local provider bakes this into every uploaded file URL.
              // It must be the publicly reachable origin in production, or
              // images resolve to localhost and render broken.
              backend_url: process.env.FILE_BACKEND_URL || 'http://localhost:9000/static',
            },
          },
        ],
      },
    },
  ],
})
