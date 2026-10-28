import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestion, QUESTION_COUNTS } from '../src/question-generator.js';

const question = {
  text: 'Który ocean jest największy?',
  options: ['Atlantycki', 'Indyjski', 'Arktyczny', 'Spokojny'],
  correctIndex: 3
};

function responseFor(input, status = 200) {
  return new Response(JSON.stringify(status === 200
    ? { content: [{ type: 'tool_use', name: 'submit_question', input }] }
    : { error: { message: 'Błąd testowy.' } }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

test('generates a validated question and randomizes the answer order', async (context) => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  context.after(() => {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
  });

  /** @type {{ url: RequestInfo | URL, options: RequestInit } | undefined} */
  let request;
  const generated = await generateQuestion({
    avoidQuestions: ['Jakie jest pytanie poprzedniej rundy?'],
    fetchImpl: async (url, options) => {
      request = { url, options };
      return responseFor(question);
    }
  });

  assert.equal(generated.text, question.text);
  assert.equal(generated.type, 'choice');
  assert.equal(generated.options.length, 4);
  assert.equal(generated.options[generated.correctIndex], question.options[question.correctIndex]);
  assert.ok(request);
  assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(request.options.headers['x-api-key'], 'test-key');
  const body = JSON.parse(String(request.options.body));
  assert.match(body.messages[0].content, /Jakie jest pytanie poprzedniej rundy/);
});

test('requires a server-side API key and reports API failures', async (context) => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  context.after(() => {
    if (previousKey !== undefined) process.env.ANTHROPIC_API_KEY = previousKey;
  });
  await assert.rejects(generateQuestion(), /ANTHROPIC_API_KEY/);

  process.env.ANTHROPIC_API_KEY = 'test-key';
  await assert.rejects(
    generateQuestion({ fetchImpl: async () => responseFor(null, 401) }),
    /Anthropic API \(401\): Błąd testowy/
  );
});

test('rejects malformed questions from the model', async (context) => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  context.after(() => {
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
  });
  await assert.rejects(
    generateQuestion({ fetchImpl: async () => responseFor({ ...question, correctIndex: 5 }) }),
    /poza dozwolonym zakresem/
  );
  assert.deepEqual(QUESTION_COUNTS, [5, 10, 15, 20, 25]);
});
