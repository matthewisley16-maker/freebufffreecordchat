import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auditAdmin, currentUserId, requirePanelAccess } from "./lib";
import { stripLoneSurrogates } from "../lib/message-format";

/**
 * "Report to admin" — the error report members can send from any error state.
 *
 * The report carries what the user saw (message, optionally the stack), the page
 * they were on, and an optional note they wrote themselves. It is deliberately
 * small and secret-free: no session tokens, no message contents, no email. The
 * Admin Panel reads them newest-first and can resolve or reopen each one.
 */

const MAX_MESSAGE = 2000;
const MAX_NOTE = 2000;
const MAX_STACK = 6000;
const MAX_URL = 500;
const MAX_SOURCE = 120;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 5;

function clip(value: string | undefined, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = stripLoneSurrogates(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
  return cleaned || undefined;
}

export const submit = mutation({
  args: {
    message: v.string(),
    note: v.optional(v.string()),
    stack: v.optional(v.string()),
    url: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    const user = await ctx.db.get(userId);
    const message = clip(args.message, MAX_MESSAGE);
    if (!message) throw new ConvexError("There was no error text to report.");

    // Per-account throttle: the button is easy to press twice, and a broken page
    // should never be able to flood the Admin Panel.
    const cutoff = Date.now() - RATE_WINDOW_MS;
    const recent = await ctx.db
      .query("errorReports")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    if (recent.filter((row) => row._creationTime > cutoff).length >= RATE_LIMIT) {
      throw new ConvexError("You've sent several reports just now. Please try again in a few minutes.");
    }

    const reportId = await ctx.db.insert("errorReports", {
      userId,
      name: clip(user?.name, 120) ?? "Unknown member",
      username: clip(user?.username, 60),
      message,
      note: clip(args.note, MAX_NOTE),
      stack: clip(args.stack, MAX_STACK),
      url: clip(args.url, MAX_URL),
      source: clip(args.source, MAX_SOURCE),
      status: "open",
    });
    return { reportId };
  },
});

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("open"), v.literal("resolved"), v.literal("all"))),
  },
  handler: async (ctx, { status }) => {
    const userId = await currentUserId(ctx);
    await requirePanelAccess(ctx, userId);
    const wanted = status ?? "open";
    const rows =
      wanted === "all"
        ? await ctx.db.query("errorReports").order("desc").take(200)
        : await ctx.db
            .query("errorReports")
            .withIndex("by_status", (q) => q.eq("status", wanted))
            .order("desc")
            .take(200);
    const open = await ctx.db
      .query("errorReports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(200);
    return {
      openCount: open.length,
      reports: rows.map((row) => ({
        _id: row._id,
        name: row.name,
        username: row.username ?? null,
        message: row.message,
        note: row.note ?? null,
        stack: row.stack ?? null,
        url: row.url ?? null,
        source: row.source ?? null,
        status: row.status,
        createdAt: row._creationTime,
      })),
    };
  },
});

export const setResolved = mutation({
  args: { reportId: v.id("errorReports"), resolved: v.boolean() },
  handler: async (ctx, { reportId, resolved }) => {
    const userId = await currentUserId(ctx);
    await requirePanelAccess(ctx, userId);
    const report = await ctx.db.get(reportId);
    if (!report) throw new ConvexError("That report no longer exists.");
    await ctx.db.patch(reportId, {
      status: resolved ? "resolved" : "open",
      resolvedAt: resolved ? Date.now() : undefined,
      resolvedBy: resolved ? userId : undefined,
    });
    const admin = await ctx.db.get(userId);
    await auditAdmin(ctx, {
      action: resolved ? "reports.resolve" : "reports.reopen",
      actorId: userId,
      actorName: admin?.name ?? "Administrator",
      targetType: "errorReport",
      targetId: reportId as string,
      detail: `${resolved ? "Resolved" : "Reopened"} an error report from ${report.name}`,
    });
    return { ok: true };
  },
});
