export default function HomeScreen({ roomFromUrl, onOpenBuilder, onJoin }) {
  const submitJoin = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onJoin(
      String(formData.get("code") || ""),
      String(formData.get("name") || ""),
    );
  };

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="sparkle">✦</span> Your people. One game.
          </span>
          <h1>
            Think fast.
            <br />
            <span>Play together.</span>
          </h1>
          <p>
            Create a quiz, invite your friends, and see who takes the top spot.
          </p>
          <div className="hero-points">
            <span>
              <span className="check">✓</span> Works on phones
            </span>
            <span>
              <span className="check">✓</span> No account or app needed
            </span>
          </div>
        </div>
        <div className="home-cards">
          <button className="host-card" onClick={onOpenBuilder} type="button">
            <span className="card-icon host-icon">✎</span>
            <span className="card-text">
              <strong>Create a quiz</strong>
              <small>You host, everyone else plays</small>
            </span>
            <span className="card-arrow">↗</span>
          </button>
          <form className="join-card" onSubmit={submitJoin}>
            <div className="join-card-heading">
              <span className="card-icon join-icon">⌁</span>
              <span>
                <strong>Join a game</strong>
                <small>Got a code from the host?</small>
              </span>
            </div>
            <label className="sr-only" htmlFor="room-code">
              Room code
            </label>
            <input
              id="room-code"
              className="code-input"
              name="code"
              placeholder="GAME CODE"
              maxLength="5"
              autoComplete="one-time-code"
              defaultValue={roomFromUrl.toUpperCase()}
              required
            />
            <label className="sr-only" htmlFor="player-name">
              Your name
            </label>
            <input
              id="player-name"
              className="name-input"
              name="name"
              placeholder="What should we call you?"
              maxLength="20"
              required
            />
            <button className="button button-primary full-width" type="submit">
              Join game <span>→</span>
            </button>
          </form>
          <div className="home-footnote">
            <span className="shield">◇</span> Claude generates questions as you play.
          </div>
        </div>
      </section>
      <section className="how-it-works">
        <div>
          <span className="step-number">01</span>
          <div>
            <strong>Choose the number of questions</strong>
            <small>Claude creates new questions for every game.</small>
          </div>
        </div>
        <span className="step-connector"></span>
        <div>
          <span className="step-number">02</span>
          <div>
            <strong>Share the code</strong>
            <small>Friends can join from their phones.</small>
          </div>
        </div>
        <span className="step-connector"></span>
        <div>
          <span className="step-number">03</span>
          <div>
            <strong>Win the round</strong>
            <small>Answer quickly to earn more points.</small>
          </div>
        </div>
      </section>
    </>
  );
}
