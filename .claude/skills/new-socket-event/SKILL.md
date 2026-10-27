---
name: new-socket-event
description: 'Use when adding, changing, or removing a Socket.IO event in Quiz Live. Keeps server validation, typed client/server payloads, reconnection behavior, documentation, and tests in sync.'
---

# Add a Socket.IO event

1. Read `CLAUDE.md`, `src/game.js`, `server.js`, `client/src/App.jsx`, the relevant component in `client/src/components/`, and `test/game.test.js`.
2. Define the event name, payload, acknowledgement, authorization rule, and failure messages before implementation.
3. Keep business rules in `GameManager`; keep Socket.IO parsing, acknowledgements, and broadcasts in `server.js`.
4. Update the React event handler in `client/src/App.jsx` and any affected component in `client/src/components/`. React escapes text rendered as JSX; avoid injecting untrusted HTML.
5. Add focused tests for valid behavior, invalid payloads, unauthorized callers, and relevant reconnect or race cases.
6. Update the event table in `CLAUDE.md`.
7. Run `npm run check` and report the event contract and test result.

Do not leak correct answers or session tokens in a room-wide broadcast. Preserve the `{ ok, error? }` acknowledgement pattern.
