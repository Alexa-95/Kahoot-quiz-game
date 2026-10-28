import { randomInt } from "node:crypto";

export const QUESTION_COUNTS = [5, 10, 15, 20, 25];

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";

/**
 * @param {{ avoidQuestions?: string[], fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<{ text: string, type: 'choice', options: string[], correctIndex: number }>}
 */
export async function generateQuestion({
  avoidQuestions = [],
  fetchImpl = fetch,
} = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey)
    throw new Error("Missing API key. Set the ANTHROPIC_API_KEY environment variable.");

  const response = await fetchImpl(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      temperature: 1,
      tools: [
        {
          name: "submit_question",
          description: "Return one quiz question with its answer options.",
          input_schema: {
            type: "object",
            properties: {
              text: { type: "string" },
              options: {
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 4,
              },
              correctIndex: { type: "integer", minimum: 0, maximum: 3 },
            },
            required: ["text", "options", "correctIndex"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_question" },
      messages: [
        {
          role: "user",
          content: [
            "Create one short, unambiguous general-knowledge quiz question in English.",
            "Choose a topic at random, such as science, geography, history, culture, nature, or sports.",
            "Provide exactly four short answer options and the index of the correct answer from 0 to 3.",
            "Do not repeat or paraphrase any earlier question.",
            avoidQuestions.length
              ? `Earlier questions in this game:\n${avoidQuestions.map((question) => `- ${question}`).join("\n")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const result = await response.json();
  if (!response.ok) {
    const message = result?.error?.message;
    throw new Error(
      `Anthropic API error (${response.status})${message ? `: ${message}` : "."}`,
    );
  }

  const toolResult = Array.isArray(result?.content)
    ? result.content.find(
        (item) => item?.type === "tool_use" && item?.name === "submit_question",
      )
    : undefined;
  const question = toolResult?.input;
  if (
    !question ||
    typeof question.text !== "string" ||
    typeof question.correctIndex !== "number" ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    question.options.some((option) => typeof option !== "string")
  ) {
    throw new Error("Claude returned a question in an invalid format.");
  }

  const text = question.text.trim();
  const options = question.options.map((option) => option.trim());
  if (
    text.length < 5 ||
    text.length > 160 ||
    options.some((option) => option.length < 1 || option.length > 50) ||
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex > 3
  ) {
    throw new Error("Claude returned a question outside the allowed limits.");
  }

  const shuffledOptions = [...options];
  let correctIndex = question.correctIndex;
  for (let index = shuffledOptions.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffledOptions[index], shuffledOptions[swapIndex]] = [
      shuffledOptions[swapIndex],
      shuffledOptions[index],
    ];
    if (correctIndex === index) correctIndex = swapIndex;
    else if (correctIndex === swapIndex) correctIndex = index;
  }

  return { text, type: "choice", options: shuffledOptions, correctIndex };
}
