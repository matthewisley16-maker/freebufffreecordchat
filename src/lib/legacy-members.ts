/**
 * Members carried over from the previous site.
 *
 * This is a one-time migration list, not a source of truth: the Admin Panel
 * shows an "Import" button that sends it to `admin.importMembers`, which creates
 * only the accounts that do not exist yet. Everyone here gets the temporary
 * password `0000` (set by the backend, not stored here) so they can sign in and
 * change it themselves in Settings.
 *
 * Roles are the ones these accounts held before. `owner_admin` is never taken
 * from this list — ownership is decided by the protected owner email/username in
 * `convex/lib.ts`, so `matthewisley23` (a protected owner address) still becomes
 * an Owner Admin on import and cannot be demoted from here.
 */
export type LegacyMember = {
  username: string;
  name: string;
  email?: string;
  role?: "user" | "moderator" | "admin";
};

export const LEGACY_MEMBERS: LegacyMember[] = [
  { username: "matthewisley23", name: "Matthewisley", email: "matthewisley23@gmail.com" },
  { username: "that_melancholy_bat", name: "†𝔇𝖊𝔞𝖉𝔩𝖞 𝔑𝔦𝔤𝔥𝔱𝔰𝔥𝔞𝔡𝔢𝔰†", email: "j0ll1b33.1s.l1f3.4nd.r1c3@gmail.com", role: "admin" },
  { username: "lillyofthevalley", name: "Lils", role: "moderator" },
  { username: "angelic_dis3ase", name: "༻♱𝑨𝒏𝒈𝒆𝒍𝒊𝒄 𝑫𝒊𝒔𝒆𝒂𝒔𝒆♱༺" },
  { username: "elysiann", name: "AjIsBored" },
  { username: "ash627509", name: "Ash", email: "ash627509@gmail.com" },
  { username: "mad4you", name: "bamgyyuu" },
  { username: "bat_toula2011", name: "Bat" },
  { username: "braeden", name: "Braeden Mosieur", email: "bmosieur2010@gmail.com" },
  { username: "skzafterhours", name: "chae-berry", email: "chaeyoung.xoxo315@gmail.com" },
  { username: "admin13d", name: "dawdaq2" },
  { username: "deli", name: "deli" },
  // The old account had no usable username ("—"), so it is derived from its email.
  { username: "lilly.green", name: "Freebuff member", email: "lilly.green@mhcbe.ab.ca" },
  { username: "funnyman", name: "funnyman" },
  { username: "genayysis", name: "Genayysis", email: "lunn.genesis@gmail.com" },
  { username: "serviceerror.idc", name: "Ghost :3" },
  { username: "xxgh0ulg1rllxx", name: "Ghoul", email: "2225643@jeffcoschools.us" },
  { username: "guest123", name: "guest123" },
  { username: "jasonmelrose40", name: "Jasonmelrose", email: "jasonmelrose40@gmail.com" },
  { username: "kameeyah16", name: "Kameeyah", email: "kameeyah16@gmail.com" },
  { username: "mckenzie", name: "Kenzie" },
  { username: "kyra.exe", name: "Kyra", email: "kyleigh.flem@gmail.com" },
  { username: "cutecore", name: "lev" },
  { username: "bugyy", name: "Lev" },
  { username: "lilly", name: "Lilly Shapiro" },
  { username: "m00np00l", name: "M00NP00L" },
  { username: "mafuyureal", name: "Mafuyu" },
  { username: "kenzie", name: "Mckenzie" },
  { username: "de4dfr3qu3cy", name: "mOBSCENCE" },
  { username: "nico", name: "Nico", email: "sarahjkittleson@gmail.com" },
  // Same address as `skzafterhours`; only the first account keeps it.
  { username: "oddinarynight", name: "𝓡𝓲𝓿𝓮𝓻" },
  { username: "roboticwarrior", name: "RoboticWarrior" },
  { username: "sakurabel654", name: "Sakurabel", email: "sakurabel654@gmail.com" },
  { username: "softcore", name: "spider" },
  { username: "bunny", name: "toxicvapes" },
];
