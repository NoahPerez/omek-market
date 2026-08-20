# Debug Session: coolify-runtime-exit
- **Status**: [OPEN]
- **Issue**: Coolify deployments succeed and containers start, but the API server and/or worker later exit or restart instead of staying up.
- **Debug Server**: Pending startup
- **Log File**: .dbg/trae-debug-log-coolify-runtime-exit.ndjson

## Reproduction Steps
1. Deploy the API server or worker service in Coolify from the monorepo Dockerfile setup.
2. Observe deployment logs reporting that the container was created and started successfully.
3. After startup, observe the service status transition to exited or restarting.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | The split server/worker setup is correct, but one service is crashing at runtime due to missing runtime-only configuration or initialization failure after boot. | High | Low | Pending |
| B | The worker service is healthy enough, but Coolify service settings such as ports, startup command, or service type are mismatched with how the built artifact runs. | High | Low | Pending |
| C | The built Medusa artifact starts, then crashes on module initialization (payments, dashboard modules, file module, or Mercur module boot) and the failure only appears in runtime logs. | High | Low | Pending |
| D | The Docker image/runtime combination is inconsistent with what Mercur/Medusa expects after build, causing `bun run start` to fail only after container boot. | Medium | Medium | Pending |
| E | The env duplication between server and worker is mostly harmless, and the real issue is a single incorrect value or absent runtime behavior that both services share. | Medium | Low | Pending |

## Log Evidence
- Deployment logs currently show successful image creation and `Container ... Started`.
- No runtime stack trace has been captured in this session yet.
- Bundled Mercur self-host docs require `projectConfig.workerMode = process.env.MEDUSA_WORKER_MODE` and `admin.disable = process.env.DISABLE_MEDUSA_ADMIN === "true"`.
- Current [medusa-config.ts](file:///Users/noahperez/Documents/omek-market/packages/api/medusa-config.ts) reads `DATABASE_URL`, `REDIS_URL`, and CORS values, but does not read `MEDUSA_WORKER_MODE` or `DISABLE_MEDUSA_ADMIN`.
- Current [medusa-config.ts](file:///Users/noahperez/Documents/omek-market/packages/api/medusa-config.ts) always mounts both UI modules, so server and worker builds currently boot the same app behavior.

## Verification Conclusion
Initial static evidence strongly supports Hypothesis E and partially supports A/B: the Coolify split-service setup is valid, but the current app config does not yet differentiate server and worker behavior the way Mercur documents for self-hosting.
