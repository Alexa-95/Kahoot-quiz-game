export default function BuilderScreen({ onBack, onCreate, isGenerating }) {
  const submit = (event) => {
    event.preventDefault();
    onCreate(Number(new FormData(event.currentTarget).get("questionCount")));
  };

  return (
    <section className="builder-page">
      <button className="back-link" type="button" onClick={onBack}>
        ← Wróć
      </button>
      <div className="builder-header">
        <span className="eyebrow">NOWA ROZGRYWKA</span>
        <h1>
          Ty wybierasz <span>ile.</span>
        </h1>
        <p>Claude wymyśli nowe pytanie na każdą rundę.</p>
      </div>
      <form onSubmit={submit} className="builder-form">
        <label
          className="field-label question-count-label"
          htmlFor="question-count"
        >
          Liczba pytań
          <select
            id="question-count"
            className="question-count-select"
            name="questionCount"
            defaultValue="10"
            disabled={isGenerating}
          >
            {[5, 10, 15, 20, 25].map((count) => (
              <option value={count} key={count}>
                {count} pytań
              </option>
            ))}
          </select>
        </label>
        <div className="random-quiz-note">
          <span className="sparkle">✦</span>
          <span>
            <strong>Każda gra jest inna</strong>
            <small>Nowe pytania z różnych dziedzin, bez powtórek.</small>
          </span>
        </div>
        <div className="builder-submit">
          <span>Do utworzenia quizu potrzebne jest połączenie z Claude.</span>
          <button
            className="button button-primary"
            type="submit"
            disabled={isGenerating}
          >
            {isGenerating ? (
              "Claude tworzy pytanie…"
            ) : (
              <>
                Stwórz quiz <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
