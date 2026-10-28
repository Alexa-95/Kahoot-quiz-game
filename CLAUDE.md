# Quiz Live

Quiz Live is a browser-based multiplayer quiz. Claude generates quiz questions through the Anthropic API; the API key is configured on the server and is never sent to browsers. Rooms and scores remain in memory.

## Architecture

- `server.js` serves the React app, hosts Socket.IO, requests new questions from Anthropic, and routes validated game actions to the game manager.
- `src/game.js` owns room state, quiz validation, answer scoring, reconnects, and player-safe state snapshots.
- `src/question-generator.js` requests and validates one new question at a time and securely shuffles its answer options.
- `client/` contains the React screens and Socket.IO client; Vite serves them in development and builds them to `public/build/`.
- `public/styles.css` contains the responsive, dependency-free UI styles.
- Rooms and scores live in server memory and are cleared when the server restarts.

## Socket events

| Direction | Event | Purpose |
|---|---|---|
| Client → server | `host:create` | Accept a supported question count, generate the first question, and create a room |
| Client → server | `host:resume` | Reconnect a host using the room token |
| Client → server | `player:join` | Join a lobby or resume a player token |
| Client → server | `player:resume` | Reconnect a player after a browser reconnect |
| Client → server | `quiz:start` | Start the first timed question |
| Client → server | `player:answer` | Submit one answer for the current question |
| Client → server | `quiz:next` | Generate and reveal the next question, or finish the quiz |
| Server → client | `room:state` | Send a role-aware snapshot; correct answers stay hidden until reveal |
| Client → server | `room:leave` | Remove the player or close the room as its host |
| Server → client | `room:closed` | Notify players when the host closes the room |

Every action event uses a Socket.IO acknowledgement shaped as `{ ok, error? }`. Keep validation and authorization in `src/game.js`; never trust client timers, scores, room membership, or answer correctness.

## Commands

- `npm install` — install dependencies.
- `npm run dev` — start the server with automatic restart on file changes.
- `npm start` — build the React app and start the server without watch mode.
- `npm run build` — build the React app to `public/build/`.
- `npm test` — run the Node test suite.
- `npm run typecheck` — check JavaScript with TypeScript's `checkJs`.
- `npm run check` — run typecheck and tests.

The server binds to `0.0.0.0:3000`, so phones on the same Wi-Fi can open the computer's LAN IP. Allow Node.js through the local firewall if prompted.
For deployments, set `PUBLIC_URL` to the public origin so generated QR codes use the public address; local QR codes select a LAN IPv4 address.
Set `ANTHROPIC_API_KEY` on the server before creating rooms. `ANTHROPIC_MODEL` can optionally override the default model.

## Test rules

Add focused tests for state transitions, authorization, duplicate/late answers, reconnect behavior, generated-question validation, and any new Socket.IO event. `test/socket.test.js` exercises the browser-facing protocol against a local Socket.IO server using a mocked Anthropic response. Run `npm run check` before completing changes. Never put API keys in client code or tests.

The host chooses only a question count (5, 10, 15, 20, or 25). Claude generates the first question when creating a room and each later question after the previous reveal. Avoid repeating earlier questions in the same room. Question types and answer values are validated on the server, and correct answers must remain hidden from players until reveal.
