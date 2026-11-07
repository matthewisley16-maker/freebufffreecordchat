/**
 * The ONE Convex deployment Freecord talks to.
 *
 * Dev, preview and the deployed website all read and write this deployment, so
 * there is exactly one place to change it and exactly one place to read it from.
 * `src/main.tsx` builds the client from it, and `src/lib/diagnostics.ts` reports
 * it so an operational problem can name the affected deployment without a
 * network request.
 *
 * NOTE (dev/production separation): because this project currently has a single
 * deployment, development traffic (the sandbox `convex dev` process and the
 * preview app) is counted against the SAME usage limits as the deployed site —
 * a development spike can pause production. `scripts/preflight.mjs` checks the
 * frontend/backend deployment identity and the configured usage limits before a
 * deploy; if separate dev/prod deployments are ever created, point the develop
 * environment at the dev one here and keep the deployed build on this value.
 */
/**
 * Resolve the deployment from the build environment ONLY.
 *
 * There is deliberately no hard-coded fallback: a build with no VITE_CONVEX_URL
 * must fail loudly instead of silently talking to some other database.
 */
function resolveConvexUrl(): string {
  const url = import.meta.env.VITE_CONVEX_URL;
  if (!url) {
    throw new Error(
      "No Convex deployment is configured for this build. Set VITE_CONVEX_URL to https://<deployment>.convex.cloud and rebuild.",
    );
  }
  return url;
}

export const CONVEX_URL = resolveConvexUrl();

/** Short deployment name ("greedy-parrot-298") — safe to display. */
export const DEPLOYMENT_NAME = CONVEX_URL.replace(/^https?:\/\//, "").replace(/\.convex\.(cloud|site).*$/, "");
