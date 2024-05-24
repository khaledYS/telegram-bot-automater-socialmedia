import { Context } from "telegraf";
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { IgUpVideo, storeVideo } from "./instagram";
dotenv.config();
const token = process.env.TOKEN;
// const chnl_token = process.env.CHNL;
const bot = new Telegraf<Context>(token!);

// Start command
bot.command("start", async (ctx) => {
    // ctx.telegram.
    await ctx.reply("Send the link of the tiktok video \n ارسل رابط الفيديو")
})

bot.use(async (ctx, next)=>{
    const id = ctx.callbackQuery?.from.id || ctx.message?.from.id || ctx.from?.id
    if(id == process.env.ADMIN_ID){
        next()
    }else{
        ctx.reply("Only Owner is allowed to use this bot. \nContact Owner for mroe info:@OxGkcl")
    }
})
bot.on("video", async (ctx) => {
    const message_id = ctx.message.message_id;
    const chat_id = ctx.chat.id;
    const fileId = ctx.update.message.video;
    const file_link = (await ctx.telegram.getFileLink(fileId)).href
    await ctx.reply("Done Uploading Video to Telegram Server ")
    const storingVideoInServer = (await ctx.reply("Store Video in Server⛔")).message_id;
    const uploadingToInstagram = (await ctx.reply("Upload video to instagram⛔")).message_id;
    console.log(chat_id)
    try {

        await ctx.reply((file_link), {
            // @ts-ignore
            reply_to_message_id: message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Store Video", callback_data: JSON.stringify(["storeVideo", [storingVideoInServer, chat_id]]) }],
                    [{ text: "Upload to Insta", callback_data: JSON.stringify(["uploadToInsta", [uploadingToInstagram, chat_id]]) }],
                ],
            }
        })
    } catch (error) {
        console.log(error)
    }

});


bot.on("callback_query", async (ctx) => {
    try {
        if (!("data" in ctx.update.callback_query) || !("text" in ctx.update.callback_query.message!)) return;
        const data: string = ctx.update.callback_query.data as string
        const fileLink: string = ctx.update.callback_query.message.text as string
        const [option, [message_id, chat_id]] = JSON.parse(data);
        const mainMessage = ctx.update.callback_query.message.message_id 
        if(option === "storeVideo"){
            await storeVideo({fileLink,mainMessage, message_id, chat_id, ctx})
        }else if(option === "uploadToInsta"){
            await IgUpVideo({
                 message_id, chat_id, ctx
            })
        }
    } catch (error) {
        console.log(error)
    }
})




bot.on("message", async (ctx) => {
    if (!('text' in ctx.update.message)) return;

    // await IgUpVideo(text, "hopes")
})
bot.catch(async (err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
    await ctx.reply("خطأ, حاول مجدداً في وقتٍ لاحق.")
    await ctx.telegram.sendMessage(1326076292, "خطأ, حاول مجدداً في وقتٍ لاحق." + ctx.updateType)
})


export {
    bot
}