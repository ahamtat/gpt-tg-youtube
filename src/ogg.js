import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import { createWriteStream } from "fs";

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { removeFile } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    toMP3(input, output) {
        try {
            const outputPath = resolve(dirname(input), `${output}.mp3`);
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOption('-t 30')
                    .output(outputPath)
                    .on("end", () => {
                        console.log("finished converting to mp3");
                        removeFile(input);
                        resolve(outputPath);
                    })
                    .on("error", (error) => {
                        console.error("error while converting to mp3", error.message);
                        reject(error.message);
                    })
                    .run();
            });
        } catch (error) {
            console.error('error while converting to mp3', error.message);
        }
    }

    async create(url, filename) {
        try {
            const oggPath = resolve(__dirname, "../voices", `${filename}.ogg`);
            const response = await axios({
                method: "GET",
                url: url,
                responseType: "stream"
            });
            return new Promise((resolve, reject) => {
                const stream = createWriteStream(oggPath);
                response.data.pipe(stream);
                stream.on("finish", () => resolve(oggPath));
            });
        } catch (error) {
            console.error('error while creating ogg', error.message);
        }

    }
}

export const ogg = new OggConverter();