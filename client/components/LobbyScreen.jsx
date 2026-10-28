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
      onToast("Kod pokoju skopiowany.");
    } catch {
      onToast(`Kod pokoju: ${room.code}`);
    }
  };

  return (
    <section className="lobby-page">
      <div className="lobby-top">
        <span className="eyebrow">
          <span className="online-dot"></span>{" "}
          {isHost ? "POKÓJ GOTOWY" : "DOŁĄCZONO DO GRY"}
        </span>
        <button className="back-link" onClick={onLeave} type="button">
          Opuść pokój
        </button>
      </div>
      <div className="lobby-layout">
        <div className="lobby-main">
          <span className="eyebrow">QUIZ</span>
          <h1>{room.title}</h1>
          <p>
            {isHost
              ? "Pokaż kod ekipie. Gdy wszyscy będą gotowi — startujemy!"
              : "Czekasz na prowadzącego. Za chwilę zaczynamy!"}
          </p>
          {isHost ? (
            <>
              <div className="room-code-card">
                <span>KOD DOŁĄCZENIA</span>
                <strong>{room.code}</strong>
                <button className="copy-code" onClick={copyCode} type="button">
                  Kopiuj kod
                </button>
              </div>
              <div className="qr-card">
                <img
                  className="qr-image"
                  alt="Kod QR do dołączenia do pokoju"
                  src={`/api/qr/${encodeURIComponent(room.code)}`}
                />
                <span>
                  <strong>Zeskanuj i dołącz</strong>
                  <small>Otwórz aparat w telefonie</small>
                </span>
              </div>
              <button
                className="button button-primary start-button"
                onClick={onStart}
                type="button"
                disabled={players.length === 0}
              >
                Rozpocznij quiz <span>→</span>
              </button>
            </>
          ) : (
            <div className="waiting-pulse">
              <span className="pulse-ring"></span>
              <span>Jesteś na liście graczy</span>
            </div>
          )}
          <div className="lobby-meta">
            <span>{room.totalQuestions} pytań</span>
            <span>·</span>
            <span>15 sekund na odpowiedź</span>
          </div>
        </div>
        <aside className="players-panel">
          <div className="players-title">
            <div>
              <h2>Gracze</h2>
              <p>Ekipa w pokoju</p>
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
              <strong>Tu zaraz będzie tłoczno</strong>
              <small>Udostępnij kod i poczekaj na graczy.</small>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
