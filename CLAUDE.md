# Quiz Live

Quiz Live is a browser-based multiplayer quiz. The application has no AI calls, API keys, database, or external runtime services.

## Architecture

- `server.js` serves the static browser app, hosts Socket.IO, and routes validated game actions to the game manager.
- `src/game.js` owns room state, quiz validation, answer scoring, reconnects, and player-safe state snapshots.
- `src/question-pool.js` contains the offline question bank and securely shuffles questions and answer options for each new game.
- `public/app.js` renders the host and player screens and communicates through Socket.IO acknowledgements and `room:state`.
- `public/styles.css` contains the responsive, dependency-free UI styles.
- Rooms and scores live in server memory and are cleared when the server restarts.

## Socket events

| Direction | Event | Purpose |
|---|---|---|
| Client → server | `host:create` | Accept a supported question count and create a random quiz from the local pool |
| Client → server | `host:resume` | Reconnect a host using the room token |
| Client → server | `player:join` | Join a lobby or resume a player token |
| Client → server | `player:resume` | Reconnect a player after a browser reconnect |
| Client → server | `quiz:start` | Start the first timed question |
| Client → server | `player:answer` | Submit one answer for the current question |
| Client → server | `quiz:next` | Reveal the next question or finish the quiz |
| Server → client | `room:state` | Send a role-aware snapshot; correct answers stay hidden until reveal |
| Client → server | `room:leave` | Remove the player or close the room as its host |
| Server → client | `room:closed` | Notify players when the host closes the room |

Every action event uses a Socket.IO acknowledgement shaped as `{ ok, error? }`. Keep validation and authorization in `src/game.js`; never trust client timers, scores, room membership, or answer correctness.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — start the server with automatic restart on file changes.
- `npm start` — start the server without watch mode.
- `npm test` — run the Node test suite.
- `npm run typecheck` — check JavaScript with TypeScript's `checkJs`.
- `npm run check` — run typecheck and tests.

The server binds to `0.0.0.0:3000`, so phones on the same Wi-Fi can open the computer's LAN IP. Allow Node.js through the local firewall if prompted.
For deployments, set `PUBLIC_URL` to the public origin so generated QR codes use the public address; local QR codes select a LAN IPv4 address.

## Test rules

Add focused tests for state transitions, authorization, duplicate/late answers, reconnect behavior, and any new Socket.IO event. `test/socket.test.js` exercises the browser-facing protocol against a local Socket.IO server. Run `npm run check` before completing changes. Do not add a runtime API key or service requirement.

The host chooses only a question count (5, 10, 15, 20, or 25). Questions and their answer order are selected and shuffled on the server without repeats in one room. The local pool must contain more unique questions than the largest supported quiz size. Question types are validated on the server. `choice` supports 2–4 answers; `true_false` always uses the built-in `Prawda` and `Fałsz` answers. New types must be hidden safely from players until reveal and covered by tests.
