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
            <span className="sparkle">✦</span> Twoja ekipa. Jedna gra.
          </span>
          <h1>
            Myśl szybko.
            <br />
            <span>Graj razem.</span>
          </h1>
          <p>
            Stwórz quiz, zaproś znajomych i zobacz, kto zgarnie pierwsze
            miejsce.
          </p>
          <div className="hero-points">
            <span>
              <span className="check">✓</span> Działa na telefonie
            </span>
            <span>
              <span className="check">✓</span> Bez kont i aplikacji
            </span>
          </div>
        </div>
        <div className="home-cards">
          <button className="host-card" onClick={onOpenBuilder} type="button">
            <span className="card-icon host-icon">✎</span>
            <span className="card-text">
              <strong>Stwórz quiz</strong>
              <small>Ty prowadzisz, inni grają</small>
            </span>
            <span className="card-arrow">↗</span>
          </button>
          <form className="join-card" onSubmit={submitJoin}>
            <div className="join-card-heading">
              <span className="card-icon join-icon">⌁</span>
              <span>
                <strong>Dołącz do gry</strong>
                <small>Masz kod od prowadzącego?</small>
              </span>
            </div>
            <label className="sr-only" htmlFor="room-code">
              Kod pokoju
            </label>
            <input
              id="room-code"
              className="code-input"
              name="code"
              placeholder="KOD GRY"
              maxLength="5"
              autoComplete="one-time-code"
              defaultValue={roomFromUrl.toUpperCase()}
              required
            />
            <label className="sr-only" htmlFor="player-name">
              Twój nick
            </label>
            <input
              id="player-name"
              className="name-input"
              name="name"
              placeholder="Jak mamy Cię nazywać?"
              maxLength="20"
              required
            />
            <button className="button button-primary full-width" type="submit">
              Dołącz do gry <span>→</span>
            </button>
          </form>
          <div className="home-footnote">
            <span className="shield">◇</span> Pytania tworzy Claude w trakcie
            gry.
          </div>
        </div>
      </section>
      <section className="how-it-works">
        <div>
          <span className="step-number">01</span>
          <div>
            <strong>Wybierz liczbę pytań</strong>
            <small>Claude tworzy je dla każdej gry.</small>
          </div>
        </div>
        <span className="step-connector"></span>
        <div>
          <span className="step-number">02</span>
          <div>
            <strong>Udostępnij kod</strong>
            <small>Znajomi dołączają z telefonu.</small>
          </div>
        </div>
        <span className="step-connector"></span>
        <div>
          <span className="step-number">03</span>
          <div>
            <strong>Wygraj rundę</strong>
            <small>Szybka odpowiedź = więcej punktów.</small>
          </div>
        </div>
      </section>
    </>
  );
}
