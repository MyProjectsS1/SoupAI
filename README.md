# Soup AI Discord Bot

Discord support bot using Discord.js and Gemini. It is ready for Railway with `npm start`.

## Features

- Answers Discord messages as a support assistant
- Reads image, audio, video, PDF, text, markdown, CSV, and JSON attachments when Gemini supports the file
- Generates images with `/imagem`, `/image`, `/img`, `/draw`, or natural prompts such as `crie uma imagem...`
- Sends audio with `/audio`, `/voz`, `/tts`, or natural prompts asking for audio/voice
- Keeps a small per-user/per-channel conversation history
- Rotates through multiple Gemini API keys when a retryable quota/server error happens
- Keeps a Railway health check HTTP server online

## Railway start command

```bash
npm start
```

## Required variables

Copy `.env.example` and set at least:

```bash
DISCORD_TOKEN=...
GEMINI_API_KEY_1=...
```

Optional but useful:

```bash
LOG_CHANNEL_ID=...
REPLY_MODE=all
```

Use `REPLY_MODE=mention` if you only want the bot to answer DMs or messages that mention the bot.
