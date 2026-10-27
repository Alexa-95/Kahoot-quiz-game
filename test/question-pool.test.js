import test from 'node:test';
import assert from 'node:assert/strict';
import { createRandomQuiz, QUESTION_COUNTS, QUESTION_POOL } from '../src/question-pool.js';

test('creates quizzes with the selected question count and no repeated questions', () => {
  const quiz = createRandomQuiz(15);
  assert.equal(quiz.questions.length, 15);
  assert.equal(new Set(quiz.questions.map((question) => question.text)).size, 15);
});

test('shuffles answer order while keeping the correct answer matched', () => {
  const quiz = createRandomQuiz(25);
  const originalQuestions = new Map(QUESTION_POOL.map((question) => [
    question.text,
    question.options[question.correctIndex]
  ]));
  for (const question of quiz.questions) {
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length);
    assert.equal(question.options.length, question.type === 'true_false' ? 2 : 4);
    assert.equal(question.options[question.correctIndex], originalQuestions.get(question.text));
  }
});

test('allows only the supported question counts and rejects counts larger than the pool', () => {
  assert.deepEqual(QUESTION_COUNTS, [5, 10, 15, 20, 25]);
  assert.throws(() => createRandomQuiz(0), /Wybierz liczbę pytań/);
  assert.throws(() => createRandomQuiz(26), /Wybierz liczbę pytań/);
  assert.ok(QUESTION_POOL.length > Math.max(...QUESTION_COUNTS));
});

test('supports deterministic shuffling for reproducible tests', () => {
  const firstQuiz = createRandomQuiz(5, (max) => max - 1);
  const secondQuiz = createRandomQuiz(5, (max) => max - 1);
  assert.deepEqual(firstQuiz.questions, secondQuiz.questions);
});
