export default function FinishedScreen({ room, onHome }) {
  const winner = room.ranking[0];

  return (
    <section className="finished-page">
      <div className="confetti confetti-one"></div>
      <div className="confetti confetti-two"></div>
      <span className="eyebrow">
        <span className="sparkle">✦</span> THAT WAS A GREAT GAME
      </span>
      <h1>
        Quiz <span>complete!</span>
      </h1>
      <p>
        {room.title} · {room.totalQuestions} questions · {room.playerCount} players
      </p>
      {winner && (
        <div className="winner-card">
          <span className="winner-crown">♛</span>
          <span className="winner-avatar">
            {winner.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="winner-name">{winner.name}</span>
          <span className="winner-score">
            {winner.score} <small>pts</small>
          </span>
          <span className="winner-label">WINNER</span>
        </div>
      )}
      <div className="final-ranking">
        <div className="final-ranking-title">
          <h2>Final leaderboard</h2>
          <span>{room.ranking.length} players</span>
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
            <span className="final-score">{player.score} pts</span>
          </div>
        ))}
      </div>
      <button className="button button-primary" onClick={onHome} type="button">
        Play again <span>→</span>
      </button>
    </section>
  );
}
