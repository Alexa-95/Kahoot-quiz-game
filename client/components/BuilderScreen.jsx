export default function BuilderScreen({ onBack, onCreate, isGenerating }) {
  const submit = (event) => {
    event.preventDefault();
    onCreate(Number(new FormData(event.currentTarget).get("questionCount")));
  };

  return (
    <section className="builder-page">
      <button className="back-link" type="button" onClick={onBack}>
        ← Back
      </button>
      <div className="builder-header">
        <span className="eyebrow">NEW GAME</span>
        <h1>
          You choose <span>how many.</span>
        </h1>
        <p>Claude will generate a new question for each round.</p>
      </div>
      <form onSubmit={submit} className="builder-form">
        <label
          className="field-label question-count-label"
          htmlFor="question-count"
        >
          Number of questions
          <select
            id="question-count"
            className="question-count-select"
            name="questionCount"
            defaultValue="10"
            disabled={isGenerating}
          >
            {[5, 10, 15, 20, 25].map((count) => (
              <option value={count} key={count}>
                {count} questions
              </option>
            ))}
          </select>
        </label>
        <div className="random-quiz-note">
          <span className="sparkle">✦</span>
          <span>
            <strong>Every game is different</strong>
            <small>Fresh questions from different topics, with no repeats.</small>
          </span>
        </div>
        <div className="builder-submit">
          <span>A connection to Claude is required to create a quiz.</span>
          <button
            className="button button-primary"
            type="submit"
            disabled={isGenerating}
          >
            {isGenerating ? (
              "Claude is generating a question…"
            ) : (
              <>
                Create quiz <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
