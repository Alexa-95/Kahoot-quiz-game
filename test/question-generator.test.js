import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestion, QUESTION_COUNTS } from '../src/question-generator.js';

const question = {
  text: 'Which is the largest ocean?',
  options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
  correctIndex: 3
};

function responseFor(input, status = 200) {
  return new Response(JSON.stringify(status === 200
    ? { content: [{ type: 'tool_use', name: 'submit_question', input }] }
    : { error: { message: 'Test error.' } }), {
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
    avoidQuestions: ['What was the previous round question?'],
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
  assert.match(body.messages[0].content, /in English/);
  assert.match(body.messages[0].content, /What was the previous round question/);
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
    /Anthropic API error \(401\): Test error/
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
    /outside the allowed limits/
  );
  assert.deepEqual(QUESTION_COUNTS, [5, 10, 15, 20, 25]);
});
