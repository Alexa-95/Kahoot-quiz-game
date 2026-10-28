export default function LobbyScreen({
  room,
  isHost,
  onStart,
  onLeave,
  onToast,
}) {
  const players = room.ranking.filter((player) => player.connected);
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      onToast("Room code copied.");
    } catch {
      onToast(`Room code: ${room.code}`);
    }
  };

  return (
    <section className="lobby-page">
      <div className="lobby-top">
        <span className="eyebrow">
          <span className="online-dot"></span>{" "}
          {isHost ? "ROOM READY" : "JOINED GAME"}
        </span>
        <button className="back-link" onClick={onLeave} type="button">
          Leave room
        </button>
      </div>
      <div className="lobby-layout">
        <div className="lobby-main">
          <span className="eyebrow">QUIZ</span>
          <h1>{room.title}</h1>
          <p>
            {isHost
              ? "Share the code with everyone. We'll start when they're ready!"
              : "Waiting for the host. The game will start soon!"}
          </p>
          {isHost ? (
            <>
              <div className="room-code-card">
                <span>JOIN CODE</span>
                <strong>{room.code}</strong>
                <button className="copy-code" onClick={copyCode} type="button">
                  Copy code
                </button>
              </div>
              <div className="qr-card">
                <img
                  className="qr-image"
                  alt="QR code to join the room"
                  src={`/api/qr/${encodeURIComponent(room.code)}`}
                />
                <span>
                  <strong>Scan to join</strong>
                  <small>Open your phone's camera</small>
                </span>
              </div>
              <button
                className="button button-primary start-button"
                onClick={onStart}
                type="button"
                disabled={players.length === 0}
              >
                Start quiz <span>→</span>
              </button>
            </>
          ) : (
            <div className="waiting-pulse">
              <span className="pulse-ring"></span>
              <span>You're on the player list</span>
            </div>
          )}
          <div className="lobby-meta">
            <span>{room.totalQuestions} questions</span>
            <span>·</span>
            <span>15 seconds to answer</span>
          </div>
        </div>
        <aside className="players-panel">
          <div className="players-title">
            <div>
              <h2>Players</h2>
              <p>Your game crew</p>
            </div>
            <span className="player-count">{players.length}</span>
          </div>
          {players.length ? (
            <ol className="player-list">
              {players.map((player, index) => (
                <li key={player.name}>
                  <span className={`player-avatar avatar-${index % 5}`}>
                    {player.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>{player.name}</span>
                  <span className="player-ready">●</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-players">
              <span>♧</span>
              <strong>It's quiet in here… for now</strong>
              <small>Share the code and wait for players to join.</small>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
