import { useEffect, useState } from "react";

export default function QuestionScreen({
  room,
  isHost,
  isGenerating,
  onNext,
  onAnswer,
}) {
  const question = room.question;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (room.phase !== "question") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [room.phase, question?.id]);

  if (!question) return null;
  const revealed = room.phase === "reveal";
  const remaining = Math.max(0, Math.ceil((question.endsAt - now) / 1000));

  return (
    <section className="game-page">
      <div className="game-top">
        <a className="brand" href="/">
          <span className="brand-mark">Q</span>
          <span>
            quiz<span className="brand-accent">live</span>
          </span>
        </a>
        <span className="game-room-code">
          POKÓJ <strong>{room.code}</strong>
        </span>
        <span className="question-progress">
          PYTANIE {room.currentIndex + 1} <span>/ {room.totalQuestions}</span>
        </span>
      </div>
      <div className="game-summary">
        <span className="eyebrow">{room.title}</span>
        <span>
          {isHost
            ? `${room.playersAnswered} / ${room.playerCount} odpowiedzi`
            : room.hasAnswered
              ? "Odpowiedź zapisana!"
              : "Wybierz odpowiedź"}
        </span>
      </div>
      <div className="timer-bar">
        <span
          style={{
            width: `${revealed ? 0 : Math.max(0, Math.min(100, (remaining / 15) * 100))}%`,
          }}
        />
      </div>
      <div className={`question-stage ${isHost ? "presenter-stage" : ""}`}>
        <div
          className={`timer-badge ${remaining <= 5 && !revealed ? "timer-urgent" : ""}`}
        >
          {revealed ? "✓" : remaining}
        </div>
        <h1>{question.text}</h1>
        {isHost && (
          <p className="game-instruction">
            Gracze wybierają odpowiedź na swoich telefonach
          </p>
        )}
        <div className="answer-grid">
          {question.options.map((option, index) => {
            const correct = revealed && index === question.correctIndex;
            const wrong = revealed && index !== question.correctIndex;
            return (
              <div
                className={`answer-tile tile-${index} ${correct ? "correct-tile" : ""} ${wrong ? "dimmed-tile" : ""}`}
                key={`${index}-${option}`}
              >
                <span className="tile-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="tile-text">{option}</span>
                {correct && <span className="tile-mark">✓</span>}
                {!isHost && !revealed && (
                  <button
                    onClick={() => onAnswer(index)}
                    type="button"
                    aria-label={`Odpowiedź: ${option}`}
                    disabled={room.hasAnswered}
                  />
                )}
              </div>
            );
          })}
        </div>
        {revealed ? (
          <>
            <div className="reveal-panel">
              <span className="reveal-icon">✦</span>
              <div>
                <strong>Prawidłowa odpowiedź</strong>
                <p>{question.options[question.correctIndex]}</p>
              </div>
            </div>
            <div className="round-footer">
              <RankingPreview room={room} />
              {isHost ? (
                <button
                  className="button button-primary"
                  onClick={onNext}
                  type="button"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    "Claude tworzy pytanie…"
                  ) : (
                    <>
                      Dalej <span>→</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="waiting-next">
                  Czekamy na kolejne pytanie…
                </span>
              )}
            </div>
          </>
        ) : (
          !isHost &&
          room.hasAnswered && (
            <div className="answer-sent">
              <span>✓</span> Dobra robota! Odpowiedź zapisana.
            </div>
          )
        )}
      </div>
    </section>
  );
}

function RankingPreview({ room }) {
  return (
    <div className="round-ranking">
      <span>RANKING</span>
      {room.ranking.slice(0, 3).map((player, index) => (
        <div key={player.name}>
          <span className="rank-medal">{["🥇", "🥈", "🥉"][index]}</span>
          <strong>{player.name}</strong>
          <small>{player.score} pkt</small>
        </div>
      ))}
    </div>
  );
}
