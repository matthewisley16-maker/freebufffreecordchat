/**
 * The Freecord buddy — a small purple blob with a big grin, raised arms and
 * sparkly eyes. It is inline SVG so it costs almost nothing to draw, stays sharp
 * at any size and inherits the site's purple palette.
 *
 * `mood="happy"` closes the mouth into a smile (used by the mini game when the
 * player is doing well); the default "oops" face is the one on error screens.
 */
export default function FreecordBuddy({
  size = 140,
  mood = "oops",
  className,
  title,
}: {
  size?: number;
  mood?: "oops" | "happy";
  className?: string;
  title?: string;
}) {
  const happy = mood === "happy";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id="fcb-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b79bff" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#7239e8" />
        </linearGradient>
        <linearGradient id="fcb-mouth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b0a63" />
          <stop offset="1" stopColor="#25053f" />
        </linearGradient>
        <radialGradient id="fcb-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="70" cy="70" rx="66" ry="66" fill="url(#fcb-glow)" />
      <ellipse cx="70" cy="128" rx="34" ry="5.5" fill="#000" opacity="0.35" />

      {/* sparkles */}
      <g fill="#c4b5fd" opacity="0.9">
        <path d="M112 30l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z" />
        <path d="M26 44l1.8 4.4 4.4 1.8-4.4 1.8L26 56.4l-1.8-4.4L19.8 50l4.4-1.8z" opacity="0.75" />
      </g>

      {/* legs */}
      <rect x="47" y="100" width="17" height="24" rx="8.5" fill="#6d28d9" stroke="#40157a" strokeWidth="3" />
      <rect x="76" y="100" width="17" height="24" rx="8.5" fill="#6d28d9" stroke="#40157a" strokeWidth="3" />

      {/* arms, raised */}
      <g stroke="#40157a" strokeWidth="3" strokeLinejoin="round">
        <path d="M34 78c-9-3-16-11-18-21-1-6 4-11 10-9 7 3 12 11 14 20z" fill="#9b74ff" />
        <path d="M106 78c9-3 16-11 18-21 1-6-4-11-10-9-7 3-12 11-14 20z" fill="#9b74ff" />
      </g>

      {/* body */}
      <path
        d="M70 16c-24 0-41 17-41 44v33c0 9 8 15 17 15h48c9 0 17-6 17-15V60c0-27-17-44-41-44Z"
        fill="url(#fcb-body)"
        stroke="#40157a"
        strokeWidth="3.5"
      />

      {/* face */}
      <g>
        <ellipse cx="52" cy="55" rx="9.5" ry="12" fill="#1c0a33" />
        <ellipse cx="88" cy="55" rx="9.5" ry="12" fill="#1c0a33" />
        <circle cx="55" cy="51" r="3.4" fill="#fff" />
        <circle cx="91" cy="51" r="3.4" fill="#fff" />
        <circle cx="49.5" cy="60" r="1.7" fill="#fff" opacity="0.85" />
        <circle cx="85.5" cy="60" r="1.7" fill="#fff" opacity="0.85" />

        <ellipse cx="37" cy="70" rx="7" ry="4.2" fill="#fb7185" opacity="0.6" />
        <ellipse cx="103" cy="70" rx="7" ry="4.2" fill="#fb7185" opacity="0.6" />

        {happy ? (
          <path
            d="M56 76c4 6 10 9 14 9s10-3 14-9"
            fill="none"
            stroke="#2a0a45"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
        ) : (
          <g>
            <path
              d="M45 74h50a7 7 0 0 1 7 7c0 13-14 22-32 22s-32-9-32-22a7 7 0 0 1 7-7Z"
              fill="url(#fcb-mouth)"
              stroke="#2a0a45"
              strokeWidth="2.5"
            />
            <path
              d="M49 78l6.5 7.5L62 78l6.5 7.5L75 78l6.5 7.5L88 78l6.5 7.5L101 78"
              fill="none"
              stroke="#fff"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx="70" cy="96" rx="11" ry="4.6" fill="#fb7185" opacity="0.85" />
          </g>
        )}
      </g>
    </svg>
  );
}
