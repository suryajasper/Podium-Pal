export const options = {
  method: "POST",
  headers: {
    "xi-api-key": "8d2f76fb4c3d5dfa6580b49c9bf7069d",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "textInput",
    voice_settings: {
      similarity_boost: 0.75,
      stability: 0.62,
    },
    model_id: "eleven_multilingual_v2",
  }),
};
