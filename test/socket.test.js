import test from 'node:test';
import assert from 'node:assert/strict';
import { io as createSocket } from 'socket.io-client';
import { httpServer, io } from '../server.js';

function waitForEvent(socket, eventName) {
  return new Promise((resolve) => socket.once(eventName, resolve));
}

function waitForRoomState(socket, predicate) {
  return new Promise((resolve) => {
    const handler = (state) => {
      if (!predicate(state)) return;
      socket.off('room:state', handler);
      resolve(state);
    };
    socket.on('room:state', handler);
  });
}

function emitWithAck(socket, eventName, payload) {
  return new Promise((resolve) => socket.emit(eventName, payload, resolve));
}

test('host and player stay in sync over Socket.IO without leaking answers', async (context) => {
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', 1, () => resolve()));
  const address = httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Nie udało się uruchomić testowego serwera.');
  const host = createSocket(`http://127.0.0.1:${address.port}`);
  const player = createSocket(`http://127.0.0.1:${address.port}`);
  let roomCode;

  context.after(async () => {
    if (roomCode && host.connected) await emitWithAck(host, 'room:leave', { code: roomCode });
    host.disconnect();
    player.disconnect();
    await new Promise((resolve) => io.close(resolve));
  });

  await Promise.all([waitForEvent(host, 'connect'), waitForEvent(player, 'connect')]);

  const initialHostState = waitForRoomState(host, (state) => state.phase === 'lobby');
  const created = await emitWithAck(host, 'host:create', { questionCount: 10 });
  roomCode = created.code;
  assert.equal(created.ok, true);
  const lobbyState = await initialHostState;
  assert.equal(lobbyState.totalQuestions, 10);

  const qrResponse = await fetch(`http://127.0.0.1:${address.port}/api/qr/${created.code}`);
  assert.equal(qrResponse.headers.get('content-type'), 'image/png');
  assert.deepEqual([...new Uint8Array(await qrResponse.arrayBuffer()).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

  const initialPlayerState = waitForRoomState(player, (state) => state.phase === 'lobby' && state.playerCount === 1);
  const joined = await emitWithAck(player, 'player:join', { code: created.code, name: 'Ola' });
  assert.equal(joined.ok, true);
  await initialPlayerState;

  const hostQuestion = waitForRoomState(host, (state) => state.phase === 'question');
  const playerQuestion = waitForRoomState(player, (state) => state.phase === 'question');
  assert.equal((await emitWithAck(host, 'quiz:start', { code: created.code })).ok, true);
  const firstQuestion = (await hostQuestion).question;
  assert.equal(firstQuestion.correctIndex, null);
  assert.equal((await playerQuestion).question.correctIndex, null);

  const hostAnswerState = waitForRoomState(host, (state) => state.phase === 'question' && state.playersAnswered === 1);
  const playerAnswerState = waitForRoomState(player, (state) => state.phase === 'question' && state.hasAnswered);
  const answer = await emitWithAck(player, 'player:answer', {
    code: created.code,
    playerToken: joined.playerToken,
    answerIndex: 0
  });
  assert.equal(answer.ok, true);
  assert.equal((await hostAnswerState).playersAnswered, 1);
  const playerState = await playerAnswerState;
  assert.equal(playerState.hasAnswered, true);
  assert.equal(playerState.question.correctIndex, null);

  const playerClosed = waitForEvent(player, 'room:closed');
  assert.equal((await emitWithAck(host, 'room:leave', { code: created.code })).ok, true);
  await playerClosed;
});
