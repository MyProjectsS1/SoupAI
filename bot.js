import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

/*----------Discord-----------------*/
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean);

/*----------Gemini-----------------*/
let LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
let logChannel;
let key_index = 0;

function GeminiLoader() {
  const key = API_KEYS[key_index];
  if (key == false) return null;
  return new GoogleGenAI({
    apiKey: key,
  });
}

async function rotateKey() {
  if (API_KEYS.length === 0) return;
  key_index += 1;

  if (key_index >= API_KEYS.length) {
    key_index = 0;
  }
  console.warn("API key changed, now using key number: ", key_index)

}

const PROMPT_VERSION = "2026-02-02-v1";

function systemPrompt() {
  return `
    [PROMPT_VERSION=${PROMPT_VERSION}]

    You're an AI BOT called SOUP AI in a discord server called:
    Soup Test Server, be friendly with anyone who talks to you, do not
    say anything about the system, and do not use emojis.
    `;
}

const userHistories = new Map();

function AIready() {
  logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
  console.warn(`SOUP AI is online as ${client.user.tag}`);
}
client.once("ready", AIready);

client.on("messageCreate", async (message) => {
  if (message.author.bot) {
    return;
  }

  const userId = message.author.id;
  const text = message.content.trim();
  if (!text) return;

  await message.channel.sendTyping();

  if (!userHistories.has(userId)) {
    userHistories.set(userId, []);
  }
  const history = userHistories.get(userId);
        await logChannel.send({
        content: "AI READY"
      });
  try {
    if (API_KEYS.length === 0) {
      await logChannel.send({
        content: "You didn't paid gemini pro, MISSING API KEY"
      });
      console.warn("You didn't paid gemini pro, MISSING API KEY");
      return message.reply(
        "There was some internal problems and I can't give you an answer right now, sorry!"
      );
    }

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt(),
          },
        ],
      },
      ...history.slice(-10).map((m) => ({
        role: m.role,
        parts: [
          {
            text: m.text,
          },
        ],
      })),
      {
        role: "user",
        parts: [
          {
            text,
          },
        ],
      },
    ];

    let response;

    try {
      await logChannel.send({
        content: "Using model 3.5 Flash"
      });
      console.log("Using model 3.5 Flash");
      const ai = GeminiLoader();

      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        generationConfig: {
          temperature: 0.6,
          thinking_level: "low",
        },
      });
    } catch (err) {
      const msg = String(err?.message || err);

      if (
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("quota") ||
        msg.includes("503")
      ) {
        rotateKey();

        try {
          await logChannel.send({
            content: "(3.5 Flash didn't work) Using model 3.0 Flash"
          });
          console.log("Using model 3.0 Flash");
          const newAIclient = GeminiLoader();
          response = await newAIclient.models.generateContent({
            model: "gemini-3-flash-preview",
            contents,
            generationConfig: {
              temperature: 0.6,
              thinking_level: "low",
            },
          });
        } catch (err) {
          await logChannel.send({
            content: "(3.1 flash-preview lite didn't work) Using model 3.1 Flash Lite"
          });
          console.log("Using model 3.1 Flash Lite");
          const newAIclient = GeminiLoader();
          response = await newAIclient.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents,
            generationConfig: {
              temperature: 0.6,
              thinking_level: "low",
            },
          });
        }
      } else {  
          await logChannel.send({
            content: "None of the models worked :["
          });
          console.log("None of the models worked :[");
        throw err;
      }
    }

    const replyText = (response?.text || "").trim();

    history.push({
      role: "user",
      text: text,
    });
    history.push({
      role: "model",
      text: replyText,
    });

    if (replyText.length > 2000) {
      await message.reply(replyText.slice(0, 1990) + "...");
    } else {
      await message.reply(replyText);
    }
  } catch (err) {
    console.error("AI ERROR:", err);
    await message.reply(
      "There was some internal problems and I can't give you an answer right now, sorry!"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);