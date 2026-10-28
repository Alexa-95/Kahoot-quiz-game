import { randomBytes } from "node:crypto";

export const QUESTION_DURATION_MS = 15_000;

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_PLAYERS = 100;

/**
 * @typedef {{ text: string, type: 'choice' | 'true_false', options: string[], correctIndex: number }} QuizQuestion
 * @typedef {{ token: string, name: string, score: number, socketId: string | null, connected: boolean, answerIndex: number | null, answerQuestionId: string | null, joinedAt: number }} Player
 * @typedef {{ code: string, title: string, questions: QuizQuestion[], totalQuestions: number, phase: 'lobby' | 'question' | 'reveal' | 'finished', hostSocketId: string | null, hostToken: string, players: Map<string, Player>, currentIndex: number, questionId: string | null, endsAt: number, createdAt: number }} Room
 */

export class GameManager {
  /** @param {{ now?: () => number, questionDurationMs?: number, tokenFactory?: () => string, codeFactory?: () => string }} [options] */
  constructor(options = {}) {
    this.now = options.now ?? Date.now;
    this.questionDurationMs =
      options.questionDurationMs ?? QUESTION_DURATION_MS;
    this.tokenFactory =
      options.tokenFactory ?? (() => randomBytes(18).toString("hex"));
    this.codeFactory =
      options.codeFactory ??
      (() => {
        const bytes = randomBytes(5);
        return [...bytes]
          .map((byte) => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length])
          .join("");
      });
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  /** @param {string} hostSocketId @param {{ title: unknown, questions: unknown }} quiz @param {number} [totalQuestions] */
  createRoom(
    hostSocketId,
    quiz,
    totalQuestions = Array.isArray(quiz?.questions) ? quiz.questions.length : 0,
  ) {
    const normalized = validateQuiz(quiz);
    if (
      !Number.isInteger(totalQuestions) ||
      totalQuestions < normalized.questions.length ||
      totalQuestions > 25
    ) {
      throw new Error("The number of questions in the quiz is invalid.");
    }
    let code = this.codeFactory();
    for (let attempts = 0; this.rooms.has(code); attempts += 1) {
      if (attempts >= 10)
        throw new Error("Could not generate a unique room code.");
      code = this.codeFactory();
    }

    /** @type {Room} */
    const room = {
      code,
      title: normalized.title,
      questions: normalized.questions,
      totalQuestions,
      phase: "lobby",
      hostSocketId,
      hostToken: this.tokenFactory(),
      players: new Map(),
      currentIndex: -1,
      questionId: null,
      endsAt: 0,
      createdAt: this.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  /** @param {string} code @returns {Room | undefined} */
  getRoom(code) {
    return this.rooms.get(normalizeCode(code));
  }

  /** @param {string} code @param {string} hostToken @param {string} socketId */
  resumeHost(code, hostToken, socketId) {
    const room = this.requireRoom(code);
    if (room.hostToken !== hostToken)
      throw new Error("Unable to resume this room.");
    room.hostSocketId = socketId;
    return room;
  }

  /** @param {string} code @param {string} name @param {string | undefined} playerToken @param {string} socketId */
  joinPlayer(code, name, playerToken, socketId) {
    const room = this.requireRoom(code);
    const cleanName = validateName(name);
    if (playerToken) {
      const returningPlayer = room.players.get(playerToken);
      if (returningPlayer) {
        returningPlayer.socketId = socketId;
        returningPlayer.connected = true;
        return { room, player: returningPlayer, resumed: true };
      }
    }
    if (room.phase !== "lobby")
      throw new Error("The quiz is already in progress. You cannot join this room.");
    if (room.players.size >= MAX_PLAYERS) throw new Error("This room is full.");
    if (
      [...room.players.values()].some(
        (player) =>
          player.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase(),
      )
    ) {
      throw new Error("That name is already taken. Choose another.");
    }

    const token = this.tokenFactory();
    const player = {
      token,
      name: cleanName,
      score: 0,
      socketId,
      connected: true,
      answerIndex: null,
      answerQuestionId: null,
      joinedAt: this.now(),
    };
    room.players.set(token, player);
    return { room, player, resumed: false };
  }

  /** @param {string} code @param {string} playerToken @param {string} socketId */
  resumePlayer(code, playerToken, socketId) {
    const room = this.requireRoom(code);
    const player = room.players.get(playerToken);
    if (!player) throw new Error("Player to resume was not found.");
    player.socketId = socketId;
    player.connected = true;
    return { room, player };
  }

  /** @param {string} code @param {string} socketId */
  startRoom(code, socketId) {
    const room = this.requireHost(code, socketId);
    if (room.phase !== "lobby") throw new Error("The quiz has already started.");
    if (room.players.size === 0)
      throw new Error("Join the room as a player before starting the quiz.");
    room.currentIndex = 0;
    room.phase = "question";
    room.questionId = `${room.code}-${this.now()}-${room.currentIndex}`;
    room.endsAt = this.now() + this.questionDurationMs;
    return room;
  }

  /** @param {string} code @param {string} socketId @param {string} playerToken @param {unknown} answerIndex */
  answer(code, socketId, playerToken, answerIndex) {
    const room = this.requireRoom(code);
    const player = room.players.get(playerToken);
    if (!player || player.socketId !== socketId || !player.connected)
      throw new Error("You are not a member of this room.");
    if (room.phase !== "question")
      throw new Error("This question is no longer accepting answers.");
    if (typeof answerIndex !== "number" || !Number.isInteger(answerIndex))
      throw new Error("Choose a valid answer.");
    if (this.now() >= room.endsAt) {
      this.reveal(room.code);
      return { accepted: false, expired: true, correct: false, points: 0 };
    }
    if (player.answerQuestionId === room.questionId)
      throw new Error("Your answer has already been submitted.");

    const question = room.questions[room.currentIndex];
    if (answerIndex < 0 || answerIndex >= question.options.length)
      throw new Error("Choose a valid answer.");
    const correct = answerIndex === question.correctIndex;
    let points = 0;
    if (correct) {
      const remainingRatio = Math.max(
        0,
        (room.endsAt - this.now()) / this.questionDurationMs,
      );
      points = 1000 + Math.round(500 * remainingRatio);
      player.score += points;
    }
    player.answerIndex = answerIndex;
    player.answerQuestionId = room.questionId;
    return { accepted: true, expired: false, correct, points };
  }

  /** @param {string} code */
  reveal(code) {
    const room = this.requireRoom(code);
    if (room.phase !== "question") return false;
    room.phase = "reveal";
    room.endsAt = 0;
    return true;
  }

  /** @param {string} code @param {string} socketId */
  nextQuestion(code, socketId) {
    const room = this.requireHost(code, socketId);
    if (room.phase !== "reveal")
      throw new Error("Wait for the question to end.");
    if (room.currentIndex === room.totalQuestions - 1) {
      room.phase = "finished";
      room.questionId = null;
      return room;
    }
    if (room.questions.length <= room.currentIndex + 1) {
      throw new Error("The next question has not been generated yet.");
    }
    room.currentIndex += 1;
    room.questionId = `${room.code}-${this.now()}-${room.currentIndex}`;
    room.phase = "question";
    room.endsAt = this.now() + this.questionDurationMs;
    for (const player of room.players.values()) {
      player.answerIndex = null;
      player.answerQuestionId = null;
    }
    return room;
  }

  /** @param {string} code @param {string} socketId @param {unknown} question */
  addNextQuestion(code, socketId, question) {
    const room = this.requireHost(code, socketId);
    if (room.phase !== "reveal")
      throw new Error("Wait for the question to end.");
    if (room.currentIndex >= room.totalQuestions - 1)
      throw new Error("The quiz is already finished.");
    if (room.questions.length !== room.currentIndex + 1)
      throw new Error("The next question has already been prepared.");
    const normalized = validateQuiz({
      title: room.title,
      questions: [question],
    }).questions[0];
    if (
      room.questions.some(
        (existing) =>
          existing.text.toLocaleLowerCase() ===
          normalized.text.toLocaleLowerCase(),
      )
    ) {
      throw new Error("This question has already appeared in the quiz. Generate another.");
    }
    room.questions.push(normalized);
    return this.nextQuestion(code, socketId);
  }

  /** @param {string} socketId */
  disconnectSocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.hostSocketId === socketId) room.hostSocketId = null;
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          player.connected = false;
          player.socketId = null;
        }
      }
    }
  }

  /** @param {string} code @param {string} socketId @param {'host' | 'player'} role @param {string | undefined} playerToken */
  leaveRoom(code, socketId, role, playerToken) {
    const room = this.requireRoom(code);
    if (role === "host") {
      if (room.hostSocketId !== socketId)
        throw new Error("Only the host can close the room.");
      this.removeRoom(room);
      return { room, closed: true };
    }
    const player = playerToken ? room.players.get(playerToken) : undefined;
    if (!player || player.socketId !== socketId)
      throw new Error("You are not a member of this room.");
    player.connected = false;
    player.socketId = null;
    return { room, closed: false };
  }

  /** @param {string} code @param {string | undefined} playerToken */
  view(code, playerToken) {
    const room = this.requireRoom(code);
    const question =
      room.currentIndex >= 0 ? room.questions[room.currentIndex] : null;
    const answeredCount =
      question && room.phase === "question"
        ? [...room.players.values()].filter(
            (player) => player.answerQuestionId === room.questionId,
          ).length
        : 0;
    const revealAnswers = room.phase === "reveal" || room.phase === "finished";
    return {
      code: room.code,
      title: room.title,
      phase: room.phase,
      playerCount: room.players.size,
      connectedCount: [...room.players.values()].filter(
        (player) => player.connected,
      ).length,
      playersAnswered: answeredCount,
      totalQuestions: room.totalQuestions,
      currentIndex: room.currentIndex,
      question: question
        ? {
            id: room.questionId,
            text: question.text,
            type: question.type,
            options: question.options,
            correctIndex: revealAnswers ? question.correctIndex : null,
            endsAt: room.endsAt,
          }
        : null,
      hasAnswered: playerToken
        ? room.players.get(playerToken)?.answerQuestionId === room.questionId
        : false,
      ranking: [...room.players.values()]
        .sort(
          (left, right) =>
            right.score - left.score || left.joinedAt - right.joinedAt,
        )
        .map((player) => ({
          name: player.name,
          score: player.score,
          connected: player.connected,
        })),
    };
  }

  /** @param {Room} room */
  removeRoom(room) {
    this.rooms.delete(room.code);
  }

  /** @param {string} code @returns {Room} */
  requireRoom(code) {
    const room = this.getRoom(code);
    if (!room)
      throw new Error("Room not found. Check the code and try again.");
    return room;
  }

  /** @param {string} code @param {string} socketId @returns {Room} */
  requireHost(code, socketId) {
    const room = this.requireRoom(code);
    if (room.hostSocketId !== socketId)
      throw new Error("Only the host can perform this action.");
    return room;
  }
}

/** @param {unknown} quiz */
/** @param {unknown} quiz @returns {{ title: string, questions: QuizQuestion[] }} */
function validateQuiz(quiz) {
  if (!quiz || typeof quiz !== "object") throw new Error("Provide quiz content.");
  const input = /** @type {{ title?: unknown, questions?: unknown }} */ (quiz);
  if (
    typeof input.title !== "string" ||
    input.title.trim().length < 2 ||
    input.title.trim().length > 60
  ) {
    throw new Error("The quiz title must be between 2 and 60 characters.");
  }
  if (
    !Array.isArray(input.questions) ||
    input.questions.length < 1 ||
    input.questions.length > 25
  ) {
    throw new Error("The quiz must contain between 1 and 25 questions.");
  }
  const questions = input.questions.map((rawQuestion, index) => {
    if (!rawQuestion || typeof rawQuestion !== "object")
      throw new Error(`Question ${index + 1} is invalid.`);
    const question =
      /** @type {{ text?: unknown, type?: unknown, options?: unknown, correctIndex?: unknown }} */ (
        rawQuestion
      );
    if (
      typeof question.text !== "string" ||
      question.text.trim().length < 5 ||
      question.text.trim().length > 160
    ) {
      throw new Error(`Question ${index + 1} must be between 5 and 160 characters.`);
    }
    if (question.type !== "choice" && question.type !== "true_false")
      throw new Error(`Unsupported question type for question ${index + 1}.`);
    const options =
      question.type === "true_false" ? ["True", "False"] : question.options;
    if (
      !Array.isArray(options) ||
      options.length < 2 ||
      options.length > 4 ||
      options.some(
        (option) =>
          typeof option !== "string" ||
          option.trim().length < 1 ||
          option.trim().length > 50,
      )
    ) {
      throw new Error(
        `Answers for question ${index + 1} must be between 1 and 50 characters.`,
      );
    }
    if (
      typeof question.correctIndex !== "number" ||
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex >= options.length
    ) {
      throw new Error(`Select the correct answer for question ${index + 1}.`);
    }
    return {
      text: question.text.trim(),
      type: /** @type {'choice' | 'true_false'} */ (question.type),
      options: options.map((option) => option.trim()),
      correctIndex: question.correctIndex,
    };
  });
  return { title: input.title.trim(), questions };
}

/** @param {unknown} value */
function validateName(value) {
  if (typeof value !== "string") throw new Error("Enter your name.");
  const name = value.trim();
  if (name.length < 2 || name.length > 20)
    throw new Error("Your name must be between 2 and 20 characters.");
  return name;
}

/** @param {string} value */
function normalizeCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}
