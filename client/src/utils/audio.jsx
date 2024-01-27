export function processAudio(file) {
  return new Promise((resolve, reject) => {
    if (file) {
      const reader = new FileReader();
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      reader.onload = function (event) {
        const base64String = event.target.result.split(",")[1];
        const audioDataArrayBuffer = base64ToArrayBuffer(base64String);

        audioContext.decodeAudioData(
          audioDataArrayBuffer,
          (decodedData) => {
            const sampleRate = decodedData.sampleRate;
            const channels = decodedData.numberOfChannels;

            const audioInfo = {
              audioBase64: base64String,
              sampleRate: sampleRate,
              channels: channels,
            };
            resolve(audioInfo);
          },
          (error) => {
            console.error("Error decoding audio file", error);
            reject(error);
          }
        );
      };

      reader.readAsDataURL(file);
    } else {
      alert("Please provide an audio file.");
      reject(new Error("No file provided"));
    }
  });
}
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
