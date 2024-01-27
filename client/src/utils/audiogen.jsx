import { convertMp3StreamToWav } from "./mp3towav";
import { options } from "../config";
export const audioGen = (text) => {
  let newOptions = options;
  let body = JSON.parse(options.body);
  body.text = text;
  newOptions.body = JSON.stringify(body);

  return fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/GBv7mTt0atIp3Br8iCZE",
    newOptions
  )
    .then(async (response) => {
      const audioInfoJson = await convertMp3StreamToWav(response.body);
      return audioInfoJson;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};
