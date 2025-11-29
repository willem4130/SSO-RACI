import type { NextConfig } from 'next'
import './src/env'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // Turbopack is enabled by default in Next.js 16+ with --turbopack flag
}

// Optionally wrap with Sentry if available
let finalConfig = withNextIntl(nextConfig)

// Only use Sentry if it's installed
try {
  const { withSentryConfig } = require('@sentry/nextjs')

  finalConfig = withSentryConfig(finalConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: {
      enabled: true,
    },
    tunnelRoute: '/monitoring',
    sourcemaps: {
      assets: ['**/*.js', '**/*.js.map'],
    },
    disableLogger: true,
    automaticVercelMonitors: true,
  })
} catch (e) {
  // Sentry not installed, skip
  console.log('Sentry not installed, skipping Sentry configuration')
}

export default finalConfig
