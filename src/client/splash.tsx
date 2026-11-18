import './index.css';

import { context, navigateTo, requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { LeaderboardSnapshot } from '../server/core/leaderboard';
import { trpc } from './trpc';

export const Splash = () => {
  const username = context.username ?? 'little chef';
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardSnapshot | null>(null);
  const [leaderboardError, setLeaderboardError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void trpc.leaderboard.get
      .query()
      .then((snapshot) => {
        if (isMounted) setLeaderboard(snapshot);
      })
      .catch(() => {
        if (isMounted) setLeaderboardError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="splash-shell">
      <section className="splash-card">
        <div className="bakery-scene" aria-label="A cozy pancake bakery">
          <span className="bakery-sun" aria-hidden="true" />
          <span className="bakery-cloud bakery-cloud-left" aria-hidden="true" />
          <span className="bakery-cloud bakery-cloud-right" aria-hidden="true" />
          <div className="bakery-shop">
            <div className="bakery-sign">
              <span>PANKAKERIA</span>
              <span aria-hidden="true">✦</span>
            </div>
            <div className="bakery-awning" aria-hidden="true" />
            <div className="bakery-window">
              <div className="bakery-avatar">
                {context.snoovatar ? (
                  <img src={context.snoovatar} alt={`${username}'s avatar`} />
                ) : (
                  <span aria-label="Your bakery avatar">🥞</span>
                )}
              </div>
              <div className="bakery-window-counter">
                <span aria-hidden="true">🥞</span>
                <small>fresh &amp; fluffy</small>
              </div>
              <div className="bakery-door" aria-hidden="true">
                <span />
              </div>
            </div>
            <div className="bakery-front" aria-hidden="true">
              <span>made with a little butter</span>
            </div>
          </div>
          <span className="bakery-sparkle bakery-sparkle-one" aria-hidden="true">✦</span>
          <span className="bakery-sparkle bakery-sparkle-two" aria-hidden="true">✧</span>
        </div>
        <div className="splash-pancake" aria-hidden="true">
          🥞
        </div>
        <h1>Pankakeria</h1>
        <button
          className="serve-button splash-start"
          type="button"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Start your shift <span aria-hidden="true">→</span>
        </button>
        <footer className="splash-footer">
          <button
            onClick={() => navigateTo('https://developers.reddit.com/docs')}
          >
            Docs
          </button>
          <span aria-hidden="true">·</span>
          <button onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}>
            r/Devvit
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => navigateTo('https://discord.com/invite/R7yu2wh9Qz')}
          >
            Discord
          </button>
        </footer>
        <section
          className="leaderboard-panel splash-leaderboard"
          hidden
          aria-labelledby="splash-leaderboard-heading"
        >
          <div className="leaderboard-heading">
            <h3 id="splash-leaderboard-heading">Bakery leaderboard</h3>
            <p>Top bakers this shift</p>
          </div>
          {leaderboardError && (
            <p className="leaderboard-message">
              Couldn’t load the leaderboard right now.
            </p>
          )}
          {!leaderboardError && !leaderboard && (
            <p className="leaderboard-message">Loading scores…</p>
          )}
          {leaderboard?.personalBest && (
            <div className="splash-personal-best">
              <span className="reddit-avatar" aria-hidden="true">
                {leaderboard.personalBest.avatarUrl && (
                  <img
                    src={leaderboard.personalBest.avatarUrl}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span>
                  {leaderboard.personalBest.username.slice(0, 1).toUpperCase()}
                </span>
              </span>
              <div>
                <span>Your best shift</span>
                <strong>
                  u/{leaderboard.personalBest.username} ·{' '}
                  {leaderboard.personalBest.moneyMade} coins
                </strong>
                <small>
                  {leaderboard.personalBest.ordersServed} orders ·{' '}
                  {leaderboard.personalBest.elapsedSeconds}s ·{' '}
                  {leaderboard.personalBest.rating.toFixed(1)} ★
                </small>
              </div>
            </div>
          )}
          {leaderboard &&
            leaderboard.entries.length > 0 &&
            leaderboard.username &&
            !leaderboard.personalBest && (
              <p className="leaderboard-message">
                Finish a shift to save your score here.
              </p>
            )}
          {leaderboard && leaderboard.entries.length > 0 && (
            <ol className="splash-leaderboard-list">
              {leaderboard.entries.map((entry, index) => (
                <li className="splash-leaderboard-entry" key={entry.username}>
                  <span className="splash-leaderboard-rank">{index + 1}</span>
                  <span className="reddit-avatar" aria-hidden="true">
                    {entry.avatarUrl && (
                      <img
                        src={entry.avatarUrl}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span>{entry.username.slice(0, 1).toUpperCase()}</span>
                  </span>
                  <strong className="splash-leaderboard-user">
                    u/{entry.username}
                  </strong>
                  <strong className="splash-leaderboard-coins">
                    {entry.moneyMade} coins
                  </strong>
                  <span className="splash-leaderboard-details">
                    {entry.ordersServed} orders · {entry.elapsedSeconds}s ·{' '}
                    {entry.rating.toFixed(1)} ★
                  </span>
                </li>
              ))}
            </ol>
          )}
          {leaderboard && leaderboard.entries.length === 0 && (
            <p className="leaderboard-message">
              {leaderboard.username
                ? 'Be the first to earn a spot!'
                : 'Sign in to join the leaderboard.'}
            </p>
          )}
        </section>
      </section>
    </main>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
