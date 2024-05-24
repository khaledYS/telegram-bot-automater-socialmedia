
/* tslint:disable:no-console */
import { IgApiClient } from 'instagram-private-api';
import { config } from "dotenv"
import https from "https"
import { readFile, createWriteStream } from "fs"
import { promisify } from "util"
import { Context } from 'telegraf';
import { InlineKeyboardButton } from '@telegraf/types';

const readFileAsync = promisify(readFile);
const ig = new IgApiClient();
config();

// ig.publish.d.ts
async function login() {
  // basic login-procedure
  ig.state.generateDevice(process.env.IG_USERNAME!);
  await ig.account.login(process.env.IG_USERNAME!, process.env.IG_PASSWORD!);
}

interface IgUpVideoOptions{
  caption?: string;
  mainMessage: number;
  message_id: number;
  chat_id: number;
  ctx: Context;
}
export const IgUpVideo = async ({caption, mainMessage, message_id, chat_id, ctx}:IgUpVideoOptions) => {
  try {
    await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Logging to Instagram...")
    await login();

    await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Succed Logging, Uploading Video...")
    const videoPath = './video.mp4';
    const coverPath = './cover.jpg';

    const publishResult = await ig.publish.video({
      // read the file into a Buffer
      caption: caption ? caption : "",
      video: await readFileAsync(videoPath),
      coverImage: await readFileAsync(coverPath),
      /*
        this does also support:
        caption (string),  ----+
        usertags,          ----+----> See upload-photo.example.ts
        location,          ----+
       */
    });
    await ctx.telegram.editMessageText(chat_id, message_id, undefined, "")
    await ctx.telegram.sendMessage(chat_id, "Finished Uploading video on instagram with the following url : instagram.com/p/" + publishResult.media.code)
  } catch (error) {

  }
}

interface storeVideoOptions {
  fileLink: string;
  mainMessage: number;
  message_id: number;
  chat_id: number;
  ctx: Context;
}
export const storeVideo = async ({
  fileLink, message_id, chat_id, ctx
}: storeVideoOptions) => {
  try {
    await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Storing Video In server...")
    const file = await getBufferFromUrl(fileLink);
    await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Stored Video in Server ✅")
  } catch (error) {
    await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Erorr occured while storing video📛")
  }
}

async function getBufferFromUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      const file = createWriteStream("video.mp4")
      response
        .on('data', (chunk: Buffer) => {
          file.write(chunk)
        })
        .on('end', () => {
          file.end()
          resolve("video.mp4")
        })
    })
  })
}