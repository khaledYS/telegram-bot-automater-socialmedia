
/* tslint:disable:no-console */
import { IgApiClient } from 'instagram-private-api/dist/index.js';
import { config } from "dotenv"
import ffmpeg from 'fluent-ffmpeg';
import { readFile, writeFileSync } from "fs"
import { path } from '@ffmpeg-installer/ffmpeg';
import { promisify } from "util"
import { Context } from 'telegraf';
import { get } from 'request-promise';
import tmp from "tmp"

ffmpeg.setFfmpegPath(path);
const readFileAsync = promisify(readFile);
const ig = new IgApiClient();
config();


// ig.publish.d.ts
async function login() {
  // basic login-procedure
  const username = process.env.IG_USERNAME!;
  const password = process.env.IG_PASSWORD!;
  console.log(username, password)
  ig.state.generateDevice(username);
  // ig.state.proxyUrl = "62.33.207.202:3128"
  await ig.account.login(username, password);
}

interface IgUpVideoOptions {
  caption?: string;
  message_id: number;
  chat_id: number;
  ctx: Context;
  fileLink: string;
}
export const IgUpVideo = async ({ fileLink, caption, chat_id, ctx }: IgUpVideoOptions) => {
  try {
    const origin = tmp.fileSync({
      postfix: ".mp4"
    });
    const saveTo = tmp.fileSync({
      postfix: ".mp4"
    });
    console.log(origin.name, saveTo.name)
    // await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Logging to Instagram...")
    // console.log("logged")
    // await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Succed Logging, Uploading Video...")
    // console.log("codey")
    const video = await get({ 
      encoding: null,
      url: fileLink
    });
    console.log("finished request")
    const videoBuffer = Buffer.from(video)
    writeFileSync(origin.name, videoBuffer );
    ffmpeg(origin.name)
      .toFormat('mp4')
      .size('1080x1920')
      .aspect('9:16')
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioChannels(2)
      .audioFrequency(48000)
      .audioBitrate('128k')
      .on('end', () => console.log(`Processing finished. Output saved to ${saveTo.name}`))
      .on('error', (err) => console.log(new Error(`Error processing video: ${err.message}`)))
      .saveToFile(saveTo.name)

    // // console.log(video, fileLink)
    console.log('logging in...')
    await login();
    console.log('uploading...')
    const publishResult = await ig.publish.video({
      // read the file into a Buffer
      caption: caption ? caption : "",
      video: await readFileAsync(saveTo.name),
      coverImage: await readFileAsync("./cover.jpg"),
      /*
        this does also support:
        caption (string),  ----+
        usertags,          ----+----> See upload-photo.example.ts
        location,          ----+
       */
    });
    // await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Uploaded to Instagram ✅")
    await ctx.telegram.sendMessage(chat_id, "Finished Uploading video on instagram with the following url : instagram.com/p/" + publishResult.media.code)
  } catch (error) {
    console.log(error)
    await ctx.telegram.sendMessage(chat_id, "Erorr occured while uploading video📛")
  }
}

// interface storeVideoOptions {
//   fileLink: string;
//   mainMessage: number;
//   message_id: number;
//   chat_id: number;
//   ctx: Context;
// }
// export const storeVideo = async ({
//   fileLink, message_id, chat_id, ctx
// }: storeVideoOptions) => {
//   try {
//     await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Storing Video In server...")
//     await getBufferFromUrl(fileLink);
//     await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Stored Video in Server ✅")
//   } catch (error) {
//     await ctx.telegram.editMessageText(chat_id, message_id, undefined, "Erorr occured while storing video📛")
//   }
// }

// async function getBufferFromUrl(url: string): Promise<string> {
//   return new Promise((resolve) => {
//     https.get(url, (response) => {
//       const file = createWriteStream("video.mp4")
//       response
//         .on('data', (chunk: Buffer) => {
//           file.write(chunk)
//         })
//         .on('end', () => {
//           file.end()
//           resolve("video.mp4")
//         })
//     })
//   })
// }