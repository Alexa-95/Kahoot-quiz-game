export default function FinishedScreen({ room, onHome }) {
  const winner = room.ranking[0];

  return (
    <section className="finished-page">
      <div className="confetti confetti-one"></div>
      <div className="confetti confetti-two"></div>
      <span className="eyebrow">
        <span className="sparkle">✦</span> TO BYŁA DOBRA GRA
      </span>
      <h1>
        Quiz <span>ukończony!</span>
      </h1>
      <p>
        {room.title} · {room.totalQuestions} pytań · {room.playerCount} graczy
      </p>
      {winner && (
        <div className="winner-card">
          <span className="winner-crown">♛</span>
          <span className="winner-avatar">
            {winner.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="winner-name">{winner.name}</span>
          <span className="winner-score">
            {winner.score} <small>pkt</small>
          </span>
          <span className="winner-label">ZWYCIĘZCA</span>
        </div>
      )}
      <div className="final-ranking">
        <div className="final-ranking-title">
          <h2>Końcowy ranking</h2>
          <span>{room.ranking.length} graczy</span>
        </div>
        {room.ranking.map((player, index) => (
          <div
            className={`final-row ${index === 0 ? "first-place" : ""}`}
            key={player.name}
          >
            <span className="final-rank">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className={`player-avatar avatar-${index % 5}`}>
              {player.name.slice(0, 1).toUpperCase()}
            </span>
            <strong>{player.name}</strong>
            <span className="final-score">{player.score} pkt</span>
          </div>
        ))}
      </div>
      <button className="button button-primary" onClick={onHome} type="button">
        Zagraj ponownie <span>→</span>
      </button>
    </section>
  );
}
