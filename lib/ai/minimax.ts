import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.MINIMAX_API_KEY;
const baseURL = process.env.MINIMAX_BASE_URL || "https://api.minimax.io/anthropic";

let client: Anthropic | null = null;

export function getMinimaxClient(): Anthropic {
  if (!client) {
    if (!apiKey) {
      throw new Error("MINIMAX_API_KEY is required");
    }
    client = new Anthropic({
      apiKey,
      baseURL,
    });
  }
  return client;
}

export const MINIMAX_MODEL = "MiniMax-M2.7";
