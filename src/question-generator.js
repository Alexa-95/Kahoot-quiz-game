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
    throw new Error(
      "Brakuje klucza API. Ustaw zmienną środowiskową ANTHROPIC_API_KEY.",
    );

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
          description: "Zwróć jedno pytanie quizowe wraz z odpowiedziami.",
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
            "Wymyśl jedno krótkie, jednoznaczne pytanie quizowe z wiedzy ogólnej po polsku.",
            "Wybierz losowo temat, np. nauka, geografia, historia, kultura, przyroda lub sport.",
            "Podaj dokładnie cztery krótkie odpowiedzi i poprawny indeks odpowiedzi od 0 do 3.",
            "Nie powtarzaj ani nie parafrazuj żadnego z wcześniejszych pytań.",
            avoidQuestions.length
              ? `Wcześniejsze pytania w tej grze:\n${avoidQuestions.map((question) => `- ${question}`).join("\n")}`
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
      `Błąd Anthropic API (${response.status})${message ? `: ${message}` : "."}`,
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
    throw new Error("Claude zwrócił pytanie w nieprawidłowym formacie.");
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
    throw new Error("Claude zwrócił pytanie poza dozwolonym zakresem.");
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
