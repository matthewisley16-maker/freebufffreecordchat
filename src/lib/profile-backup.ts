/**
 * Profile backup & restore.
 *
 * A backup is ONE ordinary JSON file the member downloads and keeps. It carries
 * everything that makes their profile theirs — display name, bio, pronouns,
 * status, interests, social links, profile theme, decorations, frame, effect,
 * nameplate, name styling, badges, widgets, privacy rules and appearance
 * settings — PLUS the actual pixels of their avatar and banner, embedded as
 * data URLs. That last part is what makes the file genuinely portable: the
 * original uploads live in storage under ids that mean nothing after they are
 * replaced or removed, so a backup that only pointed at them would restore
 * nothing.
 *
 * Restoring never touches identity or authority. Username, email, password,
 * roles, messages and communities are deliberately excluded, so a backup file
 * can never be used to take over an account, sign in as someone else, or change
 * what an account is allowed to do — it only ever rewrites the cosmetic profile
 * of the person doing the restoring.
 */

/** Marker written into every backup so a random JSON file is rejected. */
export const PROFILE_BACKUP_KIND = "freecord-profile-backup";

/** Current backup format. Bump when the shape changes incompatibly. */
export const PROFILE_BACKUP_VERSION = 1;

/** Same ceiling the profile editor enforces for a single image. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** A backup never legitimately gets near this; guards against a huge file. */
const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

export type BackupSocialLink = { label: string; url: string };

export type BackupWidget = {
  id: string;
  type: string;
  enabled: boolean;
  position: number;
  content?: string;
};

export type BackupThemeColors = {
  primary: string;
  accent: string;
  background: string;
  text?: string;
};

/** The profile fields a backup captures (a subset of the profile record). */
export type BackupProfileSource = {
  username?: string;
  displayName?: string;
  bio?: string;
  pronouns?: string;
  customStatus?: string;
  interests?: string[];
  socialLinks?: BackupSocialLink[];
  theme?: string;
  themeColors?: BackupThemeColors;
  decorationId?: string | null;
  frameId?: string | null;
  effectId?: string | null;
  nameplateId?: string | null;
  nameFont?: string;
  nameEffect?: string;
  nameColors?: string[];
  badges?: string[];
  widgets?: BackupWidget[];
  privacy?: Record<string, string | undefined>;
  activity?: { type?: string; name?: string; since?: number | null } | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
};

/** Appearance settings that travel with a profile backup. */
export type BackupAppearanceSource = {
  theme?: string;
  density?: string;
  fontSize?: number;
  messageSpacing?: number;
  reducedMotion?: boolean;
  customColors?: {
    sidebar?: string;
    background?: string;
    channel?: string;
    accent?: string;
  } | null;
};

export type ProfileBackup = {
  kind: typeof PROFILE_BACKUP_KIND;
  version: number;
  exportedAt: string;
  username: string;
  profile: Record<string, unknown>;
  appearance: Record<string, unknown> | null;
  images: { avatar: string | null; banner: string | null };
};

/** Everything the editor must provide to put a backup back on the profile. */
export type RestoreDeps = {
  /** Creates a fresh upload URL (same path the avatar uploader uses). */
  generateUploadUrl: () => Promise<string>;
  /** Applies the profile fields — the editor's own save mutation. */
  saveProfile: (args: Record<string, unknown>) => Promise<unknown>;
  /** Optional: applies appearance settings too. */
  saveAppearance?: (args: Record<string, unknown>) => Promise<unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringList(value: unknown, limit: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, limit)
    .map((item) => item.slice(0, maxLength));
}

/**
 * Read an image URL into a data URL.
 *
 * Returns null (never throws) when the image cannot be read: a backup must
 * still be downloadable when one image has gone missing, and the rest of the
 * profile is far more valuable than a single file.
 */
async function urlToDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/") || blob.size > MAX_IMAGE_BYTES) return null;
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read the image."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Build the backup object for the signed-in member. */
export async function buildProfileBackup(
  profile: BackupProfileSource,
  appearance?: BackupAppearanceSource | null,
): Promise<ProfileBackup> {
  const [avatar, banner] = await Promise.all([
    urlToDataUrl(profile.avatarUrl),
    urlToDataUrl(profile.bannerUrl),
  ]);

  return {
    kind: PROFILE_BACKUP_KIND,
    version: PROFILE_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    username: profile.username ?? "",
    profile: {
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      pronouns: profile.pronouns ?? "",
      customStatus: profile.customStatus ?? "",
      interests: profile.interests ?? [],
      socialLinks: profile.socialLinks ?? [],
      theme: profile.theme ?? "",
      themeColors: profile.themeColors ?? null,
      decorationId: profile.decorationId ?? "",
      frameId: profile.frameId ?? "",
      effectId: profile.effectId ?? "",
      nameplateId: profile.nameplateId ?? "",
      nameFont: profile.nameFont ?? "",
      nameEffect: profile.nameEffect ?? "",
      nameColors: profile.nameColors ?? [],
      badges: profile.badges ?? [],
      widgets: profile.widgets ?? [],
      privacy: Object.fromEntries(
        Object.entries(profile.privacy ?? {}).filter(([, value]) => typeof value === "string"),
      ),
      activityType: profile.activity?.type ?? "",
      activityName: profile.activity?.name ?? "",
    },
    appearance: appearance
      ? {
          theme: appearance.theme ?? "",
          density: appearance.density ?? "",
          fontSize: appearance.fontSize ?? null,
          messageSpacing: appearance.messageSpacing ?? null,
          reducedMotion: appearance.reducedMotion ?? null,
          customColors: appearance.customColors ?? null,
        }
      : null,
    images: { avatar, banner },
  };
}

/** Local (not UTC) calendar date, so the file name matches the member's day. */
function todayStamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A safe, readable file name: no slashes, no spaces, no surprises. */
export function profileBackupFileName(username: string): string {
  const safe = (username || "me").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "me";
  return `freecord-profile-${safe}-${todayStamp()}.json`;
}

/**
 * Build a backup and hand it to the browser as a download.
 * Returns the file name so the caller can confirm what was saved.
 */
export async function downloadProfileBackup(
  profile: BackupProfileSource,
  appearance?: BackupAppearanceSource | null,
): Promise<string> {
  const backup = await buildProfileBackup(profile, appearance);
  const name = profileBackupFileName(profile.username ?? "");
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Give the browser a moment to start the download before freeing the blob.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  return name;
}

/**
 * Upload one embedded image back into storage.
 * Returns the new storage id, or null when the data URL is not a supported,
 * small-enough image (the rest of the restore carries on).
 */
async function uploadEmbeddedImage(
  dataUrl: string,
  generateUploadUrl: () => Promise<string>,
): Promise<string | null> {
  const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  let bytes: Uint8Array;
  try {
    const binary = atob(match[2].replace(/\s+/g, ""));
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  } catch {
    return null;
  }
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return null;

  const uploadUrl = await generateUploadUrl();
  // A plain ArrayBuffer slice: Uint8Array<ArrayBufferLike> is not accepted as a
  // BlobPart by the DOM typings, and a binary string would be re-encoded as UTF-8.
  const body = new Blob(
    [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
    { type: mime },
  );
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": mime },
    body,
  });
  if (!response.ok) throw new Error("Could not restore your picture — please try again.");
  const result = (await response.json()) as { storageId?: unknown };
  return typeof result.storageId === "string" ? result.storageId : null;
}

/**
 * Validate and apply a backup file to the signed-in member's profile.
 *
 * Every field is re-checked here, and the server validates again on save; a
 * hand-edited or corrupted file can at worst be rejected, never smuggle in a
 * value the editor itself would not accept.
 *
 * Returns a short sentence describing what was restored.
 */
export async function restoreProfileBackup(file: File, deps: RestoreDeps): Promise<string> {
  if (file.size > MAX_BACKUP_BYTES) {
    throw new Error("That file is too large to be a profile backup.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't a Freecord profile backup.");
  }
  if (!isRecord(raw) || raw.kind !== PROFILE_BACKUP_KIND) {
    throw new Error("That file isn't a Freecord profile backup.");
  }
  if (typeof raw.version === "number" && raw.version > PROFILE_BACKUP_VERSION) {
    throw new Error("That backup was made by a newer version of Freecord. Update the site and try again.");
  }

  const profile = isRecord(raw.profile) ? raw.profile : {};
  const images = isRecord(raw.images) ? raw.images : {};
  const appearance = isRecord(raw.appearance) ? raw.appearance : null;

  const args: Record<string, unknown> = {};
  let imageCount = 0;

  // ---- images (uploaded first: a failed image must not half-apply the rest) ----
  if (typeof images.avatar === "string") {
    const id = await uploadEmbeddedImage(images.avatar, deps.generateUploadUrl);
    if (id) {
      args.avatarStorageId = id;
      imageCount += 1;
    }
  }
  if (typeof images.banner === "string") {
    const id = await uploadEmbeddedImage(images.banner, deps.generateUploadUrl);
    if (id) {
      args.bannerStorageId = id;
      imageCount += 1;
    }
  }

  // ---- identity of the profile (never username, email or role) ----
  const displayName = typeof profile.displayName === "string" ? profile.displayName.trim().slice(0, 40) : "";
  if (displayName) args.displayName = displayName;
  if (typeof profile.bio === "string") args.bio = profile.bio.slice(0, 600);
  if (typeof profile.pronouns === "string") args.pronouns = profile.pronouns.slice(0, 40);
  if (typeof profile.customStatus === "string") args.customStatus = profile.customStatus.slice(0, 120);
  if (Array.isArray(profile.interests)) args.interests = stringList(profile.interests, 12, 24);
  if (Array.isArray(profile.socialLinks)) {
    args.socialLinks = profile.socialLinks
      .filter(isRecord)
      .map((link) => ({
        label: typeof link.label === "string" ? link.label.slice(0, 24) : "",
        url: typeof link.url === "string" ? link.url.slice(0, 200) : "",
      }))
      .filter((link) => /^https?:\/\//i.test(link.url))
      .slice(0, 8);
  }

  // ---- cosmetics ----
  if (typeof profile.theme === "string" && profile.theme) args.theme = profile.theme;
  if (isRecord(profile.themeColors)) {
    const colors = profile.themeColors;
    if (typeof colors.primary === "string" && typeof colors.accent === "string" && typeof colors.background === "string") {
      args.themeColors = {
        primary: colors.primary,
        accent: colors.accent,
        background: colors.background,
        ...(typeof colors.text === "string" ? { text: colors.text } : {}),
      };
    }
  }
  for (const field of ["decorationId", "frameId", "effectId", "nameplateId"] as const) {
    if (typeof profile[field] === "string") args[field] = profile[field];
  }
  if (typeof profile.nameFont === "string" && profile.nameFont) args.nameFont = profile.nameFont;
  if (typeof profile.nameEffect === "string" && profile.nameEffect) args.nameEffect = profile.nameEffect;
  if (Array.isArray(profile.nameColors)) {
    args.nameColors = stringList(profile.nameColors, 2, 32);
  }
  if (Array.isArray(profile.badges)) args.badges = stringList(profile.badges, 24, 40);
  if (Array.isArray(profile.widgets)) {
    args.widgets = profile.widgets
      .filter(isRecord)
      .filter((widget) => typeof widget.type === "string")
      .slice(0, 12)
      .map((widget, index) => ({
        id: typeof widget.id === "string" && widget.id ? widget.id.slice(0, 40) : `restored_${index}`,
        type: String(widget.type).slice(0, 40),
        enabled: widget.enabled !== false,
        position: index,
        ...(typeof widget.content === "string" ? { content: widget.content.slice(0, 400) } : {}),
      }));
  }

  // ---- privacy rules ----
  if (isRecord(profile.privacy)) {
    const allowed = new Set(["everyone", "friends", "mutual", "none"]);
    const privacy: Record<string, string> = {};
    for (const [key, value] of Object.entries(profile.privacy)) {
      if (typeof value === "string" && allowed.has(value)) privacy[key] = value;
    }
    args.privacy = privacy;
  }

  // ---- activity (an empty name means "no activity", never a blank one) ----
  if (typeof profile.activityName === "string" && profile.activityName.trim()) {
    args.activityName = profile.activityName.trim().slice(0, 80);
    args.activityType = typeof profile.activityType === "string" && profile.activityType ? profile.activityType : "playing";
  }

  await deps.saveProfile(args);

  // ---- appearance (optional: older backups have none) ----
  if (appearance && deps.saveAppearance) {
    const next: Record<string, unknown> = {};
    if (typeof appearance.theme === "string" && appearance.theme) next.theme = appearance.theme;
    if (typeof appearance.density === "string" && appearance.density) next.density = appearance.density;
    if (typeof appearance.fontSize === "number") next.fontSize = appearance.fontSize;
    if (typeof appearance.messageSpacing === "number") next.messageSpacing = appearance.messageSpacing;
    if (typeof appearance.reducedMotion === "boolean") next.reducedMotion = appearance.reducedMotion;
    if (isRecord(appearance.customColors)) next.customColors = appearance.customColors;
    if (Object.keys(next).length > 0) await deps.saveAppearance(next);
  }

  const parts: string[] = ["Profile restored"];
  if (imageCount > 0) parts.push(imageCount === 2 ? "with your picture and banner" : "with your picture");
  return `${parts.join(" ")}.`;
}
