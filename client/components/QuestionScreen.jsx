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
          ROOM <strong>{room.code}</strong>
        </span>
        <span className="question-progress">
          QUESTION {room.currentIndex + 1} <span>/ {room.totalQuestions}</span>
        </span>
      </div>
      <div className="game-summary">
        <span className="eyebrow">{room.title}</span>
        <span>
          {isHost
            ? `${room.playersAnswered} / ${room.playerCount} answers`
            : room.hasAnswered
              ? "Answer recorded!"
              : "Choose an answer"}
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
            Players choose answers on their phones
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
                    aria-label={`Answer: ${option}`}
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
                <strong>Correct answer</strong>
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
                    "Claude is generating a question…"
                  ) : (
                    <>
                      Next <span>→</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="waiting-next">
                  Waiting for the next question…
                </span>
              )}
            </div>
          </>
        ) : (
          !isHost &&
          room.hasAnswered && (
            <div className="answer-sent">
              <span>✓</span> Nice work! Your answer has been recorded.
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
      <span>LEADERBOARD</span>
      {room.ranking.slice(0, 3).map((player, index) => (
        <div key={player.name}>
          <span className="rank-medal">{["🥇", "🥈", "🥉"][index]}</span>
          <strong>{player.name}</strong>
          <small>{player.score} pts</small>
        </div>
      ))}
    </div>
  );
}
