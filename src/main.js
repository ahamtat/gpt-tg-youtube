import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js"
import { openai } from "./openai.js";

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

// processing voice messages
bot.on(message("voice"), async (ctx) => {
    try {
        await ctx.reply(code("processing your voice message..."));
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMP3(oggPath, userId);

        const text = await openai.transcription(mp3Path);
        await ctx.reply(code(`Your request: "${text}"`));

        const messages = [{ role: openai.roles.USER, content: text }];
        const response = await openai.chat(messages);

        await ctx.reply(response.content);

    } catch (error) {
        console.error("error while voice message: ", error.message);
    }
});

bot.command("start", async (ctx) => {
    await ctx.reply(JSON.stringify(ctx.message, null, 2));
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
