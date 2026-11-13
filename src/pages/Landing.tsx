import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowRight, ArrowUpRight, AudioLines, Check, ChevronDown, Compass, Hash, Headphones, Heart, Menu, MessageCircle, Plus, Search, Send, Users, Volume2, X } from "lucide-react";

export function FreecordMark({ small = false }: { small?: boolean }) {
  return <span className={`freecord-mark ${small ? "small" : ""}`}><AudioLines strokeWidth={2.7} /><span>freecord<span className="brand-period">.</span></span></span>;
}
const initialMessages = [
  { name: "Jamie Chen", initials: "JC", color: "peach", time: "10:42 AM", body: "Hey everyone! A little something I've been working on ✨", art: true },
  { name: "Alex Rivera", initials: "AR", color: "lavender", time: "10:44 AM", body: "Oh, this is so good. The colors are everything.", art: false },
  { name: "Sam Taylor", initials: "ST", color: "sage", time: "10:45 AM", body: "That’s the energy we needed today 🙌", art: false },
];
export function ChatPreview() {
  const [channel, setChannel] = useState("general");
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<string[]>([]);
  const [liked, setLiked] = useState(false);
  const [search, setSearch] = useState("");
  return <div className="chat-preview">
    <aside className="server-rail"><div className="rail-logo"><AudioLines size={23} /></div><div className="rail-rule" /><button className="server-bubble selected" aria-label="The Creative Corner"><span>✳</span></button><Link className="server-bubble peach" to="/auth?returnTo=/dashboard" aria-label="Create your community">◒</Link><Link className="server-bubble lavender" to="/auth?returnTo=/dashboard" aria-label="Find your people">✿</Link><Link className="server-bubble add" to="/auth?returnTo=/dashboard" aria-label="Add a server"><Plus size={21} /></Link><Link className="rail-bottom" to="/auth" aria-label="Explore communities"><Compass size={22} /></Link></aside>
    <aside className="channel-sidebar"><div className="server-title">The Creative Corner <ChevronDown size={15} /></div><div className="community-banner"><span className="banner-star">✳</span><span>A little space.<br />A lot of possibility.</span></div><div className="channel-category">YOUR CHANNELS <Plus size={13} /></div>{["general", "introductions", "inspiration", "share-your-work", "off-topic"].map(c => <button key={c} onClick={() => setChannel(c)} className={`channel-item ${channel === c ? "active" : ""}`}><Hash size={17} />{c}{c === "inspiration" && <span className="channel-count">3</span>}</button>)}<div className="channel-category voice-label">VOICE LOUNGE</div><Link className="channel-item" to="/auth"><Volume2 size={17} />The hangout</Link><div className="voice-people"><span className="mini-avatar peach">JC</span><span className="mini-avatar lavender">AR</span><span className="mini-avatar sage">ST</span><span className="voice-count">+2</span></div><div className="sidebar-footer"><span className="avatar sage">YO</span><div><strong>Your space awaits</strong><small>Make yourself at home</small></div><Headphones size={16} /></div></aside>
    <section className="preview-conversation"><header className="conversation-header"><Hash size={22} /><strong>{channel}</strong><span className="header-divider" /><span className="channel-description">A little space for big conversations.</span><div className="conversation-tools"><Users size={18} /><div className="preview-search"><Search size={13} /><input aria-label="Search sample messages" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" /></div></div></header><div className="preview-messages"><div className="channel-welcome"><span className="welcome-hash"><Hash size={27} /></span><h3>Good things start with a hello<span>.</span></h3><p>This is the beginning of #{channel}. Make it yours.</p></div><div className="date-divider"><span />Today<span /></div>{(channel === "general" ? initialMessages : [{ name: "Jamie Chen", initials: "JC", color: "peach", time: "10:42 AM", body: `Welcome to #${channel}! A place to share ideas and connect.`, art: false }]).filter(m => `${m.name} ${m.body}`.toLowerCase().includes(search.toLowerCase())).map(m => <div className="preview-message" key={m.name}><span className={`avatar ${m.color}`}>{m.initials}</span><div className="message-content"><div className="message-byline"><strong>{m.name}</strong><span>{m.time}</span>{m.name === "Jamie Chen" && <b>CREATOR</b>}</div><p>{m.body}</p>{m.art && <><div className="art-card"><div className="art-topline">PERSONAL EXPLORATION — 001 <ArrowUpRight size={15} /></div><div className="art-headline">Stay curious.<br />Make things.</div><div className="art-flower">✳</div><div className="art-bottom">A reminder for the everyday creative.</div></div><div className="reaction-row"><button onClick={() => setLiked(!liked)} className={liked ? "reacted" : ""}>🙌 {liked ? 7 : 6}</button><button onClick={() => setLiked(!liked)}>❤️ {liked ? 5 : 4}</button></div></>}</div></div>)}{extra.filter(m => m.toLowerCase().includes(search.toLowerCase())).map((m, i) => <div className="preview-message" key={i}><span className="avatar sage">YO</span><div className="message-content"><div className="message-byline"><strong>You</strong><span>Just now</span><b>DEMO</b></div><p>{m}</p></div></div>)}</div><form className="preview-composer" onSubmit={e => { e.preventDefault(); if (draft.trim()) { setExtra([...extra, draft.trim()]); setDraft(""); } }}><Plus size={19} /><input aria-label="Try a sample message" value={draft} onChange={e => setDraft(e.target.value)} placeholder={`Message #${channel}`} /><button aria-label="Send sample message"><Send size={17} /></button></form><div className="demo-note"><span className="status-dot" />Interactive preview · fictional community</div></section>
    <aside className="preview-members"><div className="member-heading">THE GOOD COMPANY <span>5</span></div>{[{ name: "Jamie Chen", color: "peach", initials: "JC", status: "Making something new" }, { name: "Alex Rivera", color: "lavender", initials: "AR", status: "In the zone 🎧" }, { name: "Sam Taylor", color: "sage", initials: "ST", status: "Here for the good vibes" }, { name: "Morgan Lee", color: "sand", initials: "ML", status: "Taking it slow" }, { name: "Riley Park", color: "blue", initials: "RP", status: "Probably sketching" }].map(m => <div className="member-item" key={m.name}><span className={`avatar ${m.color}`}>{m.initials}<i /></span><div><strong>{m.name}</strong><small>{m.status}</small></div></div>)}<div className="invite-card"><span>More friends.<br />More possibilities.</span><Link to="/auth?returnTo=/dashboard">Invite your people <ArrowUpRight size={14} /></Link></div></aside>
  </div>;
}
/**
 * The operator notice on the public home page.
 *
 * It is read by signed-out visitors, so the query is public; whether it is still
 * live is decided by the server. When there is no notice it renders nothing, so
 * the home page is unchanged by default.
 */
function LandingNotice() {
  const notice = useQuery(api.admin.platformBanner, {});
  if (!notice?.announcement) return null;
  return (
    <div className="landing-notice" role="status">
      <span className="status-dot" />
      <p><strong>Notice</strong>{notice.announcement}</p>
    </div>
  );
}

const LANDING_FEATURES = [
  { icon: Users, title: "Communities", text: "Create or join communities with text, voice and video channels, roles and moderation tools." },
  { icon: MessageCircle, title: "Direct messages", text: "Private one-to-one and group chats with replies, reactions, edits, pins and file sharing." },
  { icon: Volume2, title: "Voice chat", text: "Persistent voice rooms with mute, deafen and speaking indicators. No ringing required." },
  { icon: AudioLines, title: "Video chat", text: "Turn on your camera, switch layouts and share your screen over peer-to-peer WebRTC." },
  { icon: Heart, title: "Friends", text: "Send requests, accept or decline, and keep a friends list that respects your privacy." },
  { icon: Compass, title: "Discover", text: "Browse public communities by category, see member counts and join in one click." },
];

export default function Landing() {
  const [menu, setMenu] = useState(false);

  return (
    <div className="freecord-landing">
      <LandingNotice />

      <header className="landing-nav">
        <Link to="/" aria-label="Freecord home" className="landing-logo"><FreecordMark /></Link>

        <nav className={`nav-links ${menu ? "mobile-open" : ""}`} aria-label="Main">
          <a href="#experience" onClick={() => setMenu(false)}>Preview</a>
          <a href="#why-freecord" onClick={() => setMenu(false)}>Features</a>
          <Link to="/about" onClick={() => setMenu(false)}>About</Link>
          <div className="nav-mobile-actions">
            <Link to="/auth" onClick={() => setMenu(false)}>Log in</Link>
            <Link className="button-primary" to="/auth?returnTo=/dashboard" onClick={() => setMenu(false)}>Open Freecord</Link>
          </div>
        </nav>

        <div className="nav-actions">
          <Link to="/auth" className="login-link">Log in</Link>
          <Link to="/auth?returnTo=/dashboard" className="button-primary nav-cta">Open Freecord <ArrowUpRight size={15} /></Link>
          <button
            className="mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu((open) => !open)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="hero-pill"><span className="status-dot" />A place to belong</span>
            <h1>Your people.<br />Your place<span className="accent-period">.</span></h1>
            <p>A calm home for your communities — text, voice, video and the people who matter, without the noise.</p>
            <div className="hero-actions">
              <Link className="button-primary" to="/auth">Create your account <ArrowUpRight size={17} /></Link>
              <Link className="button-ghost" to="/auth">Log in</Link>
            </div>
            <div className="hero-footnote">
              <span className="tiny-avatars"><span className="peach">J</span><span className="lavender">A</span><span className="sage">S</span></span>
              <span>Free to start · No ads · No algorithm</span>
            </div>
          </motion.div>
        </section>

        <section id="experience" className="experience-section">
          <div className="preview-caption">
            <span><span className="status-dot" />Interactive preview</span>
            <span>Click a channel or send a message — it is a demo, nothing is saved</span>
          </div>
          <ChatPreview />
          <div className="under-preview">
            <span><Check size={14} />Free to get started</span>
            <span><Check size={14} />No noisy feeds</span>
            <span><Check size={14} />Just your people</span>
          </div>
        </section>

        <section id="why-freecord" className="features-section">
          <div className="section-heading">
            <span className="eyebrow">Everything you need</span>
            <h2>A space that feels like you<span className="accent-period">.</span></h2>
            <p>Communities, direct messages, voice, video, friends and discovery — built for real conversation.</p>
          </div>
          <div className="feature-grid">
            {LANDING_FEATURES.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon"><feature.icon size={20} /></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
          <p className="features-more">
            <Link to="/about">More about how Freecord works <ArrowRight size={14} /></Link>
          </p>
        </section>

        <section id="community" className="community-cta">
          <span className="eyebrow">The best part is who&apos;s here</span>
          <h2>Make room for your people<span className="accent-period">.</span></h2>
          <p>Your next great conversation starts with a hello.</p>
          <Link className="button-primary" to="/auth?returnTo=/dashboard">Create your space <ArrowUpRight size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" aria-label="Freecord home"><FreecordMark small /></Link>
        <nav className="footer-links">
          <Link to="/about">About</Link>
          <a href="#experience">Preview</a>
          <a href="#why-freecord">Features</a>
        </nav>
        <span>© {new Date().getFullYear()} Freecord</span>
      </footer>
    </div>
  );
}
