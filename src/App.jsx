import { useCallback, useEffect, useRef, useState } from 'react';

const call = async (path, body) => {
  const res = await fetch('/api' + path, body === undefined ? undefined : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};

const THRESHOLD = 110;
const clamp = (n) => Math.max(0, Math.min(1, n));

function Photo({ p }) {
  const [ok, setOk] = useState(true);
  return (
    <div className="photo">
      <span className="initial">{p.name[0]}</span>
      {ok && <img src={p.photo} alt={p.name} draggable="false" onError={() => setOk(false)} />}
    </div>
  );
}

function Card({ p, dx = 0, dragging, handlers, behind }) {
  const style = behind
    ? { transform: 'scale(.94) translateY(14px)' }
    : { transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: dragging ? 'none' : 'transform .26s ease-out' };
  return (
    <article className={'card' + (behind ? ' behind' : '')} style={style} {...(behind ? {} : handlers)}>
      <Photo p={p} />
      {!behind && <>
        <span className="stamp like" style={{ opacity: clamp(dx / 90) }}>Like</span>
        <span className="stamp nope" style={{ opacity: clamp(-dx / 90) }}>Pass</span>
      </>}
      <div className="info">
        <h2>{p.name}, {p.age}</h2>
        <p className="place">{p.place}</p>
        <p>{p.bio}</p>
        <ul>{p.interests.map((i) => <li key={i}>{i}</li>)}</ul>
      </div>
    </article>
  );
}

function Discover() {
  const [feed, setFeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [view, setView] = useState('cards');
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const start = useRef(null);

  const load = useCallback(async () => {
    try {
      const [f, m] = await Promise.all([call('/feed'), call('/matches')]);
      setFeed(f); setMatches(m); setError('');
    } catch (e) { setError('Could not reach the server. Check that the API is running.'); setFeed([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const swipe = useCallback(async (action) => {
    if (busy || !feed?.length) return;
    const p = feed[0];
    setBusy(true); setDragging(false);
    setDx(action === 'like' ? 700 : -700); // fly the card off-screen
    try {
      const [res] = await Promise.all([call('/swipe', { profileId: p.id, action }), new Promise((r) => setTimeout(r, 260))]);
      setFeed((f) => f.filter((x) => x.id !== p.id));
      if (res.match) { setMatch(res.profile); setMatches((m) => [{ ...res.profile }, ...m]); }
    } catch (e) { setError('Swipe not saved. Try again.'); }
    setDx(0); setBusy(false);
  }, [busy, feed]);

  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'cards' || match) return;
      if (e.key === 'ArrowRight') swipe('like');
      if (e.key === 'ArrowLeft') swipe('pass');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [swipe, view, match]);

  const handlers = {
    onPointerDown: (e) => { if (busy) return; start.current = e.clientX; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: (e) => { if (start.current !== null) setDx(e.clientX - start.current); },
    onPointerUp: () => {
      if (start.current === null) return;
      start.current = null;
      if (dx > THRESHOLD) swipe('like');
      else if (dx < -THRESHOLD) swipe('pass');
      else { setDragging(false); setDx(0); }
    },
    onPointerCancel: () => { start.current = null; setDragging(false); setDx(0); },
  };

  const reset = async () => { await call('/reset', {}); setFeed(null); load(); };

  return (
    <section className="discover">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={view === 'cards'} onClick={() => setView('cards')}>Swipe</button>
        <button role="tab" aria-selected={view === 'matches'} onClick={() => setView('matches')}>
          Matches{matches.length > 0 && <b>{matches.length}</b>}
        </button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      {view === 'cards' && (feed === null ? <p className="muted">Loading profiles…</p> : feed.length === 0 ? (
        <div className="empty">
          <h2>You've seen everyone for now</h2>
          <p>Check your Matches, or come back when new people join.</p>
          <button className="primary" onClick={() => setView('matches')}>See matches</button>
          <button className="link" onClick={reset}>Reset demo data</button>
        </div>
      ) : (
        <>
          <div className="stack">
            {feed[1] && <Card key={feed[1].id} p={feed[1]} behind />}
            <Card key={feed[0].id} p={feed[0]} dx={dx} dragging={dragging} handlers={handlers} />
          </div>
          <div className="actions">
            <button className="round pass" aria-label="Pass" onClick={() => swipe('pass')} disabled={busy}>✕</button>
            <button className="round like" aria-label="Like" onClick={() => swipe('like')} disabled={busy}>♥</button>
          </div>
          <p className="hint">Drag the card or use ← → keys. We only tell someone they have a match when you both say yes.</p>
        </>
      ))}

      {view === 'matches' && (matches.length === 0 ? (
        <div className="empty"><h2>No matches yet</h2><p>When you and someone else both like each other, they show up here.</p>
          <button className="primary" onClick={() => setView('cards')}>Keep swiping</button></div>
      ) : (
        <ul className="grid">{matches.map((m) => (
          <li key={m.id}><div className="thumb"><Photo p={m} /></div><strong>{m.name}, {m.age}</strong><span>{m.place}</span></li>
        ))}</ul>
      ))}

      {match && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h1>It's a match!</h1>
            <div className="avatar"><Photo p={match} /></div>
            <p>You and {match.name} like each other.</p>
            <button className="primary" onClick={() => { setMatch(null); setView('matches'); }}>View matches</button>
            <button className="link" onClick={() => setMatch(null)}>Keep swiping</button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState('discover');
  return (
    <div className="app">
      <header><span className="logo">coy<i /></span></header>
      <main>{tab === 'home' ? <div className="blank" aria-label="Home" /> : <Discover />}</main>
      <nav>
        {['home', 'discover'].map((t) => (
          <button key={t} aria-current={tab === t} onClick={() => setTab(t)}>{t === 'home' ? 'Home' : 'Discover'}</button>
        ))}
      </nav>
    </div>
  );
}
