import { Link } from "react-router";
import { AudioLines, ArrowRight, ArrowUpRight, Compass, Heart, MessageCircle, ShieldCheck, Sparkles, Users, Volume2 } from "lucide-react";

/**
 * Public About page — the story behind Freecord, reachable signed in or out.
 *
 * It keeps the landing page's navigation and footer so the two pages feel like
 * one site, and reuses the same design tokens and spacing.
 */
function AboutMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`freecord-mark ${small ? "small" : ""}`}>
      <AudioLines strokeWidth={2.7} />
      <span>freecord<span className="brand-period">.</span></span>
    </span>
  );
}

const PRINCIPLES = [
  {
    icon: MessageCircle,
    title: "Conversations, not audiences",
    text: "There is no feed to perform for and no algorithm deciding who sees you. Messages arrive in the order they were sent, in the place they were sent.",
  },
  {
    icon: Users,
    title: "Communities you actually own",
    text: "A community has an owner, real roles and moderation tools. You decide who joins, who helps run it and how it is laid out.",
  },
  {
    icon: ShieldCheck,
    title: "Quiet by default",
    text: "No ads, no tracking for advertisers and no public follower counts driving the design. Notifications are opt-in, and you can turn them off again.",
  },
];

const PIECES = [
  { icon: Users, title: "Communities", text: "Text channels, categories, roles and moderation, plus a public Discover page for communities that choose to be listed." },
  { icon: Volume2, title: "Voice and video", text: "Persistent voice rooms with mute, deafen and speaking indicators, and peer-to-peer video with screen sharing." },
  { icon: MessageCircle, title: "Direct messages", text: "One-to-one and group conversations with replies, reactions, edits, pins, attachments and a per-chat lock." },
  { icon: Heart, title: "Friends and following", text: "Friend requests, a friends list, and following for people whose updates you want to keep up with — separate from friendship." },
  { icon: Compass, title: "Discovery", text: "Browse public communities by category and join in one click, with member counts shown up front." },
  { icon: Sparkles, title: "Profiles", text: "A display name, bio, banner, avatar and decorations — with an export you can keep and restore." },
];

export default function About() {
  return (
    <div className="freecord-landing about-page">
      <header className="landing-nav">
        <Link to="/" aria-label="Freecord home" className="landing-logo"><AboutMark /></Link>
        <nav className="nav-links" aria-label="Main">
          <Link to="/">Home</Link>
          <Link to="/#why-freecord">Features</Link>
          <Link to="/about" aria-current="page">About</Link>
        </nav>
        <div className="nav-actions">
          <Link to="/auth" className="login-link">Log in</Link>
          <Link to="/auth?returnTo=/dashboard" className="button-primary nav-cta">Open Freecord <ArrowUpRight size={15} /></Link>
        </div>
      </header>

      <main>
        <section className="about-hero">
          <span className="hero-pill"><span className="status-dot" />About Freecord</span>
          <h1>A quieter place<br />to be online<span className="accent-period">.</span></h1>
          <p>
            Freecord is an independent community platform: a home for the groups you already have and the ones you have
            not met yet. Text, voice, video and direct messages, arranged the way people actually talk.
          </p>
        </section>

        <section className="about-section">
          <div className="about-prose">
            <h2>Why we built it</h2>
            <p>
              Most places online are built to keep you scrolling. The conversation is endless, the order is decided for
              you, and the people you came to talk to are somewhere in the noise. Freecord starts from the opposite
              idea: a small number of rooms, in a place you chose, with people you know.
            </p>
            <p>
              It is deliberately unremarkable in the best way. You open it, you see your communities and your
              conversations, you talk, and you close it. Nothing is competing for your attention in the background.
            </p>
          </div>

          <div className="about-grid">
            {PRINCIPLES.map((principle) => (
              <article className="about-card" key={principle.title}>
                <span className="feature-icon"><principle.icon size={20} /></span>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section about-section-alt">
          <div className="section-heading">
            <span className="eyebrow">What is inside</span>
            <h2>Everything a community needs</h2>
            <p>Built together rather than bolted on: each piece works with the others, and nothing is hidden behind a paywall.</p>
          </div>
          <div className="about-grid">
            {PIECES.map((piece) => (
              <article className="about-card" key={piece.title}>
                <span className="feature-icon"><piece.icon size={20} /></span>
                <h3>{piece.title}</h3>
                <p>{piece.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="about-prose">
            <h2>How it is run</h2>
            <p>
              Freecord is built and maintained independently, not as a feature of a larger network. There is no
              advertising business behind it and no data sold to anyone. Communities are moderated by the people who run
              them, with a small platform team available for the things that affect the whole site.
            </p>
            <p>
              If something breaks, every error screen has a <strong>Report to admin</strong> button that sends the
              details to the people who can fix it — with room for you to explain what happened.
            </p>
          </div>
        </section>

        <section className="about-cta">
          <h2>Come in and say hello<span className="accent-period">.</span></h2>
          <p>Create an account in a minute, or sign in and pick up where you left off.</p>
          <div className="about-cta-actions">
            <Link className="button-primary" to="/auth?returnTo=/dashboard">Create your account <ArrowUpRight size={17} /></Link>
            <Link className="button-ghost" to="/auth">Log in <ArrowRight size={15} /></Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" aria-label="Freecord home"><AboutMark small /></Link>
        <nav className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/auth">Log in</Link>
        </nav>
        <span>© {new Date().getFullYear()} Freecord</span>
      </footer>
    </div>
  );
}
