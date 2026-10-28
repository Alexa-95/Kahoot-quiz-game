import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';
import { Server } from 'socket.io';
import { GameManager } from './src/game.js';
import { generateQuestion, QUESTION_COUNTS } from './src/question-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();
export const httpServer = createServer(app);
export const io = new Server(httpServer);
export const game = new GameManager();
const questionTimers = new Map();
const generatingQuestions = new Set();

app.get('/api/qr/:code', async (request, response) => {
  const code = request.params.code.toUpperCase();
  if (!game.getRoom(code)) {
    response.status(404).json({ error: 'Pokój już nie istnieje.' });
    return;
  }
  try {
    const roomUrl = `${resolveRoomOrigin(request)}/?room=${encodeURIComponent(code)}`;
    const image = await QRCode.toBuffer(roomUrl, { width: 220, margin: 1, color: { dark: '#15132b', light: '#ffffff' } });
    response.type('png').send(image);
  } catch (error) {
    console.error('Nie udało się wygenerować kodu QR:', error);
    response.status(500).json({ error: 'Nie udało się wygenerować kodu QR.' });
  }
});

io.on('connection', (socket) => {
  socket.on('host:create', async (payload, acknowledge) => {
    try {
      if (!QUESTION_COUNTS.includes(payload?.questionCount)) {
        throw new Error(`Wybierz liczbę pytań: ${QUESTION_COUNTS.join(', ')}.`);
      }
      const question = await generateQuestion();
      if (!socket.connected) throw new Error('Połączenie z prowadzącym zostało przerwane.');
      const room = game.createRoom(socket.id, { title: 'Quiz z Claude', questions: [question] }, payload.questionCount);
      socket.join(room.code);
      socket.data.role = 'host';
      socket.data.roomCode = room.code;
      acknowledge?.({ ok: true, code: room.code, hostToken: room.hostToken });
      publish(room);
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on('host:resume', (payload, acknowledge) => {
    try {
      const room = game.resumeHost(payload?.code, payload?.hostToken, socket.id);
      socket.join(room.code);
      socket.data.role = 'host';
      socket.data.roomCode = room.code;
      acknowledge?.({ ok: true, code: room.code });
      publish(room);
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on('player:join', (payload, acknowledge) => {
    try {
      const result = game.joinPlayer(payload?.code, payload?.name, payload?.playerToken, socket.id);
      socket.join(result.room.code);
      socket.data.role = 'player';
      socket.data.roomCode = result.room.code;
      socket.data.playerToken = result.player.token;
      acknowledge?.({ ok: true, code: result.room.code, playerToken: result.player.token, resumed: result.resumed });
      publish(result.room);
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on('player:resume', (payload, acknowledge) => {
    try {
      const result = game.resumePlayer(payload?.code, payload?.playerToken, socket.id);
      socket.join(result.room.code);
      socket.data.role = 'player';
      socket.data.roomCode = result.room.code;
      socket.data.playerToken = result.player.token;
      acknowledge?.({ ok: true, code: result.room.code });
      publish(result.room);
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on('quiz:start', (payload, acknowledge) => {
    try {
      const room = game.startRoom(payload?.code, socket.id);
      scheduleReveal(room);
      acknowledge?.({ ok: true });
      publish(room);
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on('player:answer', (payload, acknowledge) => {
    try {
      const result = game.answer(payload?.code, socket.id, payload?.playerToken, payload?.answerIndex);
      if (result.expired) {
        clearQuestionTimer(payload.code);
        publish(game.requireRoom(payload.code));
      }
      acknowledge?.({ ok: result.accepted, error: result.accepted ? undefined : 'Czas na odpowiedź minął.' });
      if (result.accepted) publish(game.requireRoom(payload.code));
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on('quiz:next', async (payload, acknowledge) => {
    const code = payload?.code;
    let generating = false;
    try {
      const currentRoom = game.requireHost(code, socket.id);
      if (currentRoom.phase !== 'reveal') throw new Error('Poczekaj na zakończenie pytania.');
      if (currentRoom.currentIndex === currentRoom.totalQuestions - 1) {
        const room = game.nextQuestion(code, socket.id);
        clearQuestionTimer(room.code);
        acknowledge?.({ ok: true });
        publish(room);
        return;
      }
      if (generatingQuestions.has(code)) throw new Error('Pytanie jest już generowane.');
      generatingQuestions.add(code);
      generating = true;
      const roomSnapshot = currentRoom;
      const questionIndex = currentRoom.currentIndex;
      const question = await generateQuestion({
        avoidQuestions: currentRoom.questions.map((existingQuestion) => existingQuestion.text)
      });
      if (game.requireHost(code, socket.id) !== roomSnapshot || roomSnapshot.currentIndex !== questionIndex) {
        throw new Error('Stan quizu zmienił się podczas generowania pytania. Spróbuj ponownie.');
      }
      const room = game.addNextQuestion(code, socket.id, question);
      if (room.phase === 'question') scheduleReveal(room);
      else clearQuestionTimer(room.code);
      acknowledge?.({ ok: true });
      publish(room);
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    } finally {
      if (generating) generatingQuestions.delete(code);
    }
  });

  socket.on('room:leave', (payload, acknowledge) => {
    try {
      const { room, closed } = game.leaveRoom(
        payload?.code,
        socket.id,
        socket.data.role,
        socket.data.playerToken
      );
      socket.leave(room.code);
      if (closed) {
        clearQuestionTimer(room.code);
        io.to(room.code).emit('room:closed');
      } else {
        publish(room);
      }
      delete socket.data.role;
      delete socket.data.roomCode;
      delete socket.data.playerToken;
      acknowledge?.({ ok: true });
    } catch (error) {
      acknowledge?.({ ok: false, error: errorMessage(error) });
    }
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    game.disconnectSocket(socket.id);
    if (code) {
      const room = game.getRoom(code);
      if (room) publish(room);
    }
  });
});

function publish(room) {
  if (room.hostSocketId) {
    io.sockets.sockets.get(room.hostSocketId)?.emit('room:state', game.view(room.code, undefined));
  }
  for (const player of room.players.values()) {
    if (player.socketId) {
      io.sockets.sockets.get(player.socketId)?.emit('room:state', game.view(room.code, player.token));
    }
  }
}

function resolveRoomOrigin(request) {
  const configuredOrigin = process.env.PUBLIC_URL?.trim().replace(/\/+$/, '');
  if (configuredOrigin) return configuredOrigin;

  const hostname = request.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '::1' || /^127(?:\.|$)/.test(hostname)) {
    const localAddress = Object.values(networkInterfaces())
      .flat()
      .find((address) => address && !address.internal && address.family === 'IPv4');
    if (!localAddress) throw new Error('Nie znaleziono lokalnego adresu IPv4. Ustaw PUBLIC_URL.');
    const port = request.socket.localPort;
    return `${request.protocol}://${localAddress.address}${port ? `:${port}` : ''}`;
  }

  return `${request.protocol}://${request.get('host')}`;
}

/** @param {{ code: string, endsAt: number }} room */
function scheduleReveal(room) {
  clearQuestionTimer(room.code);
  const timer = setTimeout(() => {
    if (game.reveal(room.code)) publish(room);
    questionTimers.delete(room.code);
  }, Math.max(0, room.endsAt - Date.now()));
  questionTimers.set(room.code, timer);
}

/** @param {string} code */
function clearQuestionTimer(code) {
  const timer = questionTimers.get(code);
  if (timer) clearTimeout(timer);
  questionTimers.delete(code);
}

/** @param {unknown} error */
function errorMessage(error) {
  return error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.';
}

if (process.env.NODE_ENV === 'development') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    configFile: path.join(__dirname, 'vite.config.js'),
    server: { middlewareMode: true, hmr: { server: httpServer } }
  });
  app.use(vite.middlewares);
  httpServer.on('close', () => void vite.close());
} else {
  app.use(express.static(path.join(__dirname, 'public', 'build')));
}

if (process.env.NODE_ENV === 'development'
  || (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url)))) {
  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Quiz Live działa: http://localhost:${port}`);
    console.log('Aby dołączyć z telefonu w tej samej sieci Wi-Fi, otwórz adres IP tego komputera.');
  });
}
