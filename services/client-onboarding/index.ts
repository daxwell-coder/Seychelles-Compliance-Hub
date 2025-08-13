// Deprecated: This file previously contained a duplicate implementation of the onboarding function.
// The canonical implementation now lives in src/index.ts using firebase-functions/v2 style exports.
// Re-export for backward compatibility so existing deployments referencing this path keep working.
export { onboardClientFunction } from "./src/index";
