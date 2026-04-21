/**
 * Lightweight PostHog event wrapper.
 * When NEXT_PUBLIC_POSTHOG_KEY is not set, all calls are no-ops.
 * To enable: add NEXT_PUBLIC_POSTHOG_KEY=phc_xxx to .env.local
 */

type EventProperties = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: EventProperties) => void
    }
  }
}

export function trackEvent(event: string, properties?: EventProperties) {
  if (typeof window === "undefined") return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  try {
    window.posthog?.capture(event, properties)
  } catch {
    // Never let analytics errors surface to users
  }
}
