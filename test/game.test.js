import test from 'node:test';
import assert from 'node:assert/strict';
import { GameManager } from '../src/game.js';

const quiz = {
  title: 'Test Quiz',
  questions: [
    { text: 'Question number one?', type: 'choice', options: ['Right', 'Wrong'], correctIndex: 0 },
    { text: 'Question number two?', type: 'true_false', options: ['True', 'False'], correctIndex: 1 }
  ]
};

function createGame() {
  let now = 1_000;
  let token = 0;
  const game = new GameManager({
    now: () => now,
    questionDurationMs: 15_000,
    codeFactory: () => 'ABC23',
    tokenFactory: () => `token-${++token}`
  });
  return { game, advanceTime: (milliseconds) => { now += milliseconds; } };
}

test('creates a room and rejects malformed quizzes', () => {
  const { game } = createGame();
  const room = game.createRoom('host-socket', quiz);
  assert.equal(room.code, 'ABC23');
  assert.equal(room.phase, 'lobby');
  assert.throws(() => game.createRoom('host-2', { title: 'No', questions: [] }), /between 1 and 25 questions/);
});

test('players join once, and duplicate nicknames are rejected', () => {
  const { game } = createGame();
  const room = game.createRoom('host-socket', quiz);
  const first = game.joinPlayer(room.code, 'Ola', undefined, 'player-socket');
  assert.equal(first.resumed, false);
  assert.equal(game.joinPlayer(room.code, 'Ola', first.player.token, 'new-socket').resumed, true);
  assert.throws(() => game.joinPlayer(room.code, 'ola', undefined, 'other-socket'), /already taken/);
});

test('answers are private until reveal and score depends on response speed', () => {
  const { game, advanceTime } = createGame();
  const room = game.createRoom('host-socket', quiz);
  const player = game.joinPlayer(room.code, 'Ola', undefined, 'player-socket').player;
  game.startRoom(room.code, 'host-socket');
  advanceTime(3_000);
  const answer = game.answer(room.code, 'player-socket', player.token, 0);
  assert.equal(answer.correct, true);
  assert.equal(answer.points, 1400);
  assert.equal(game.view(room.code, player.token).question.correctIndex, null);
  assert.equal(game.view(room.code, player.token).hasAnswered, true);
  assert.equal(game.view(room.code, undefined).playersAnswered, 1);
  game.reveal(room.code);
  assert.equal(game.view(room.code, player.token).question.correctIndex, 0);
});

test('prevents duplicate and late answers and verifies host authorization', () => {
  const { game, advanceTime } = createGame();
  const room = game.createRoom('host-socket', quiz);
  const player = game.joinPlayer(room.code, 'Ola', undefined, 'player-socket').player;
  game.startRoom(room.code, 'host-socket');
  assert.throws(() => game.startRoom(room.code, 'other-socket'), /Only the host/);
  game.answer(room.code, 'player-socket', player.token, 0);
  assert.throws(() => game.answer(room.code, 'player-socket', player.token, 0), /already been submitted/);
  advanceTime(15_000);
  const lateAnswer = game.answer(room.code, 'player-socket', player.token, 0);
  assert.equal(lateAnswer.expired, true);
  assert.equal(room.phase, 'reveal');
});

test('supports reconnecting a player and completing the quiz', () => {
  const { game } = createGame();
  const room = game.createRoom('host-socket', quiz);
  const player = game.joinPlayer(room.code, 'Ola', undefined, 'player-socket').player;
  game.startRoom(room.code, 'host-socket');
  game.disconnectSocket('player-socket');
  assert.equal(game.view(room.code, undefined).connectedCount, 0);
  assert.equal(game.resumePlayer(room.code, player.token, 'reconnected').player.connected, true);
  game.answer(room.code, 'reconnected', player.token, 0);
  game.reveal(room.code);
  game.nextQuestion(room.code, 'host-socket');
  assert.equal(room.currentIndex, 1);
  game.answer(room.code, 'reconnected', player.token, 1);
  game.reveal(room.code);
  game.nextQuestion(room.code, 'host-socket');
  assert.equal(game.view(room.code, undefined).phase, 'finished');
  assert.equal(game.view(room.code, undefined).ranking[0].name, 'Ola');
});

test('generates one validated question at a time without repeating or exposing answers', () => {
  const { game } = createGame();
  const room = game.createRoom('host-socket', { title: 'Test Quiz', questions: [quiz.questions[0]] }, 5);
  const player = game.joinPlayer(room.code, 'Ola', undefined, 'player-socket').player;
  assert.equal(game.view(room.code, undefined).totalQuestions, 5);
  game.startRoom(room.code, 'host-socket');
  game.reveal(room.code);
  assert.throws(() => game.nextQuestion(room.code, 'host-socket'), /not been generated yet/);
  assert.throws(() => game.addNextQuestion(room.code, 'host-socket', quiz.questions[0]), /already appeared/);
  assert.equal(room.questions.length, 1);
  const next = game.addNextQuestion(room.code, 'host-socket', quiz.questions[1]);
  assert.equal(next.currentIndex, 1);
  assert.equal(next.questions.length, 2);
  assert.equal(game.view(room.code, player.token).question.correctIndex, null);
});
