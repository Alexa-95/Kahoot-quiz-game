---
name: new-question-type
description: 'Use when adding a quiz question format such as multiple choice, true/false, ordering, or another answer interaction. Updates validation, host editor, player UI, answer scoring, and tests together.'
---

# Add a question type

1. Review `CLAUDE.md`, `src/game.js`, `src/question-generator.js`, the relevant React components under `client/components/`, `public/styles.css`, and `test/game.test.js`.
2. Specify the type's question payload, answer payload, validation limits, presentation, and scoring behavior.
3. Extend the server's quiz validation and answer rules in `src/game.js`; do not rely on browser validation for correctness.
4. Update generated-question validation and the relevant React components in `client/components/`, plus responsive styles if needed.
5. Keep correct answers out of active-question snapshots; reveal them only after the authoritative server timer ends.
6. Add tests for valid and invalid questions, scoring, authorization, duplicate submissions, and reveal behavior.
7. Update the question-type rules in `CLAUDE.md` and run `npm run check`.

Keep prompts, generated payloads, and server-side validation in sync when a type is created through the configured Anthropic API.
