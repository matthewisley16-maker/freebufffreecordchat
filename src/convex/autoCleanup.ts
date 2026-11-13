import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { auditAdmin, currentUserId, isOwnerRole, requirePanelAccess } from "./lib";

/**
 * Admin Panel → Cleanup & Maintenance → Automatic cleanup.
 *
 * A scheduled version of Message Cleanup: once a day, at an hour the owner
 * picks, the same job engine deletes messages older than a chosen number of
 * days. It creates an ordinary `cleanupJobs` row and hands it to
 * `internal.cleanup.runJobBatch`, so progress, cancellation, stale-job
 * recovery, batched deletion and the audit trail all behave exactly like a
 * manual run — the panel just watches the same job.
 *
 * Why the owner: the automatic job is site-wide, and a site-wide message
 * deletion already requires an Owner Admin. The schedule is re-validated on
 * every run: if the account that enabled it is no longer an owner, the
 * automation turns itself off instead of deleting on stale authority.
 */

const KEY = "auto-message-cleanup";

/** The next time the daily run is due (UTC), for display only. */
function nextRunAt(now: number, runHour: number): number {
  const date = new Date(now);
  const candidate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), runHour, 0, 0, 0);
  return candidate > now ? candidate : candidate + 86_400_000;
}

export const settings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    const role = await requirePanelAccess(ctx, userId);
    const row = await ctx.db
      .query("autoCleanup")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    const now = Date.now();
    const runHour = row?.runHour ?? 3;
    const lastJob = row?.lastRunJobId ? await ctx.db.get(row.lastRunJobId) : null;
    return {
      isOwner: isOwnerRole(role),
      enabled: row?.enabled ?? false,
      // One year by default: the gentlest schedule that still bounds storage.
      retentionDays: row?.retentionDays ?? 365,
      runHour,
      lastRunAt: row?.lastRunAt ?? null,
      nextRunAt: nextRunAt(now, runHour),
      lastJob: lastJob
        ? {
            jobId: lastJob._id,
            status: lastJob.status,
            messagesDeleted: lastJob.channelMessagesDeleted + lastJob.dmMessagesDeleted,
            startedAt: lastJob.startedAt,
            finishedAt: lastJob.finishedAt ?? null,
            error: lastJob.lastError ?? null,
          }
        : null,
    };
  },
});

export const saveSettings = mutation({
  args: {
    enabled: v.boolean(),
    retentionDays: v.number(),
    runHour: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    const role = await requirePanelAccess(ctx, userId);
    if (!isOwnerRole(role)) {
      throw new ConvexError("Only an Owner Admin can schedule automatic cleanup for the whole site.");
    }
    if (!Number.isInteger(args.retentionDays) || args.retentionDays < 1 || args.retentionDays > 3650) {
      throw new ConvexError("Retention must be a whole number of days between 1 and 3650.");
    }
    if (!Number.isInteger(args.runHour) || args.runHour < 0 || args.runHour > 23) {
      throw new ConvexError("Choose an hour between 00:00 and 23:00.");
    }

    const user = await ctx.db.get(userId);
    const actorName = user?.name ?? "Owner Admin";
    const now = Date.now();
    const existing = await ctx.db
      .query("autoCleanup")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();

    const values = {
      enabled: args.enabled,
      retentionDays: args.retentionDays,
      runHour: args.runHour,
      updatedAt: now,
      updatedBy: userId,
    };
    if (existing) await ctx.db.patch(existing._id, values);
    else await ctx.db.insert("autoCleanup", { key: KEY, ...values });

    await auditAdmin(ctx, {
      action: "cleanup.auto.save",
      actorId: userId,
      actorName,
      targetType: "cleanup",
      targetId: KEY,
      detail: args.enabled
        ? `Automatic cleanup on · messages older than ${args.retentionDays} day${args.retentionDays === 1 ? "" : "s"} · daily at ${String(args.runHour).padStart(2, "0")}:00 UTC`
        : "Automatic cleanup turned off",
    });

    return { saved: true };
  },
});

/**
 * Hourly tick. The cron can fire any time in the hour, so the run starts the
 * first time the tick sees the configured hour; `lastRunAt` (a 20-hour guard)
 * makes sure a day never gets two runs, and a running manual job is respected
 * rather than raced.
 */
export const autoTick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("autoCleanup")
      .withIndex("by_key", (q) => q.eq("key", KEY))
      .unique();
    if (!row?.enabled) return { ran: false, reason: "off" };

    const now = Date.now();
    if (new Date(now).getUTCHours() !== row.runHour) return { ran: false, reason: "not-due" };
    if (row.lastRunAt !== undefined && now - row.lastRunAt < 20 * 60 * 60 * 1000) {
      return { ran: false, reason: "already-ran" };
    }

    const running = await ctx.db
      .query("cleanupJobs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .first();
    if (running) return { ran: false, reason: "job-running" };

    // Re-check the scheduler's authority on every run.
    const owner = row.updatedBy ? await ctx.db.get(row.updatedBy) : null;
    if (!owner || !isOwnerRole(owner.role)) {
      await ctx.db.patch(row._id, { enabled: false, updatedAt: now });
      if (row.updatedBy) {
        await auditAdmin(ctx, {
          action: "cleanup.auto.disabled",
          actorId: row.updatedBy,
          actorName: owner?.name ?? "Automatic cleanup",
          targetType: "cleanup",
          targetId: KEY,
          detail: "Automatic cleanup turned itself off: the Owner Admin who scheduled it no longer has owner access.",
        });
      }
      return { ran: false, reason: "no-owner" };
    }

    const cutoff = now - row.retentionDays * 86_400_000;
    const jobId = await ctx.db.insert("cleanupJobs", {
      kind: "messages",
      status: "running",
      scopeKind: "all",
      scopeLabel: "Entire site (automatic)",
      rangeLabel: `Messages older than ${row.retentionDays} day${row.retentionDays === 1 ? "" : "s"}`,
      to: cutoff,
      actorId: owner._id,
      actorName: owner.name ?? "Owner Admin",
      startedAt: now,
      updatedAt: now,
      batches: 0,
      channelMessagesDeleted: 0,
      dmMessagesDeleted: 0,
      attachmentsDeleted: 0,
      recordsDeleted: 0,
      bytesFreed: 0,
      errors: 0,
      doneScopes: [],
      summary: [`Automatic run: messages older than ${row.retentionDays} day${row.retentionDays === 1 ? "" : "s"}`],
    });

    await ctx.db.patch(row._id, { lastRunAt: now, lastRunJobId: jobId, updatedAt: now });

    await auditAdmin(ctx, {
      action: "cleanup.auto.run",
      actorId: owner._id,
      actorName: owner.name ?? "Owner Admin",
      targetType: "cleanup",
      targetId: jobId as string,
      detail: `Automatic cleanup started · messages older than ${row.retentionDays} day${row.retentionDays === 1 ? "" : "s"}`,
    });

    await ctx.scheduler.runAfter(0, internal.cleanup.runJobBatch, { jobId, depth: 0 });
    return { ran: true, jobId };
  },
});
