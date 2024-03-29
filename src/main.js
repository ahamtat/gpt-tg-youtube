import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js"
import { openai } from "./openai.js";
import { textConverter } from "./text.js";

const INITIAL_SESSION = {
    messages: [],
};

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command("new", async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply("New session started");
});

bot.command("start", async (ctx) => {
    ctx.session = INITIAL_SESSION;
    await ctx.reply("New session started");
});

// processing voice messages
bot.on(message("voice"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code("processing your voice message..."));
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMP3(oggPath, userId);

        const text = await openai.transcription(mp3Path);
        await ctx.reply(code(`Your request: "${text}"`));

        ctx.session.messages.push({ role: openai.roles.USER, content: text });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content
        });

        const source = await textConverter.textToSpeech(response.content);

        await ctx.replyWithAudio({ source }, { title: 'Response from assistant', performer: 'ChatGPT' });

    } catch (error) {
        console.error("error while voice message: ", error.message);
    }
});

bot.on(message("text"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
        await ctx.reply(code("processing your text message..."));

        ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({
            role: openai.roles.ASSISTANT,
            content: response.content
        });

        await ctx.reply(response.content);

    } catch (error) {
        console.error("error while text message: ", error.message);
    }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
