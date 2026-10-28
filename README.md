# Quiz Live

A live quiz for hosts and players, playable in a browser on desktop and mobile. Claude generates a new question for each round.

## Getting started

Node.js 20 or later is required.

Install the dependencies:

```bash
npm install
```

Set your Anthropic API key on the server and start the app. In PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="your-api-key"
npm run dev
```

Open **http://localhost:3000**. The host chooses how many questions to play. The first question is generated when the room is created, and each subsequent question is generated after the current round ends. Players join using the room code. Each question requires a separate Anthropic API call and may incur charges depending on your plan.

The API key is only used by the server. Never put it in browser code or commit it to the repository. You can optionally set `ANTHROPIC_MODEL`; the default is `claude-haiku-4-5-20251001`.

On Windows, if PowerShell's execution policy blocks the `npm.ps1` script, use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Playing on multiple phones

1. Connect the computer and phones to the same Wi-Fi network.
2. Start the server on the computer.
3. On the computer, open `http://localhost:3000` and create a quiz.
4. Find the computer's local IP address (for example, `192.168.1.15`) and open `http://192.168.1.15:3000` on each phone, or scan the QR code shown on the host's screen.
5. If prompted, allow Node.js to accept connections on private networks.

For public games over the internet, use a host that supports long-lived WebSocket connections, such as Render, Railway, or Fly.io. The app relies on a persistent server to keep rooms running and does not use serverless functions for that purpose.

For a deployment, set `PUBLIC_URL` to the app's public URL (for example, `https://quiz.example.com`) so QR codes point to the correct address. Locally, QR codes use the computer's IPv4 address.

## Features

- The host chooses the number of questions (5, 10, 15, 20, or 25); Claude generates them as the game progresses and avoids earlier questions from the same game.
- Answer order is shuffled on the server. Correct answers stay hidden from players until the end of each round.
- Rooms with a five-character code, a join link, and a QR code.
- Questions and a 15-second timer synchronized through Socket.IO.
- Scores based on answer correctness and response speed.
- Round results and a final leaderboard.
- Host and player reconnection after refreshing the page.
- Responsive interface in English.

## Development

```bash
npm test          # run the game logic tests
npm run typecheck # type-check JavaScript with TypeScript checkJs
npm run check     # run type checking and tests
npm start         # build the app and start the server
```

`npm run dev` starts Express, Socket.IO, and Vite with automatic restarts. `npm start` first builds the React app to `public/build/` and then starts the server. The UI components are in `client/`.

The architecture, event contracts, and Claude Code workflow are documented in [CLAUDE.md](./CLAUDE.md) and [docs/AI-WORKFLOW.md](./docs/AI-WORKFLOW.md).

## Data and privacy

Room state and scores are stored in the server process's memory. Restarting the server clears all rooms. The player's or host's identity is stored in the browser's localStorage to allow reconnection. Questions are generated through the Anthropic API; the API key stays on the server.
