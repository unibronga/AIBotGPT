import {Telegraf, session} from 'telegraf';
import {message} from 'telegraf/filters';
import {code} from 'telegraf/format';
import config from 'config';
import {ogg} from './ogg.js';
import {openai} from './openai.js';

const INITIAL_SESSION = {messages: []};
const bot = new Telegraf(config.get('BOT_TOKEN'));

bot.use(session());

bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('Жду твоего сообщения');
});

bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply('Жду твоего сообщения');
});

bot.launch();
console.log('---==== BOT LAUNCH! ====---');
console.log(config.get('ENV'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Обрабатываю ...'));

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);

    console.log(link.href);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openai.transcription(mp3Path);

    await ctx.reply(code(`Ваш запрос: ${text}`));

    ctx.session.messages.push({role: openai.roles.USER, content: text});

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (err) {
    console.log('Error while voice message > ', err.message);
  }
});

bot.on(message('text'), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code('Обрабатываю ...'));

    ctx.session.messages.push({
      role: openai.roles.USER,
      content: ctx.message.text,
    });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (err) {
    console.log('Error while voice message > ', err.message);
  }
});
