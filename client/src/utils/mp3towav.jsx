import toWav from "audiobuffer-to-wav";

// Decode MP3 file to AudioBuffer
async function decodeMp3(file) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error("Error decoding MP3", error);
    throw error;
  }
}
async function decodeMp3Stream(arrayBuffer) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error("Error decoding MP3", error);
    throw error;
  }
}
// Convert MP3 file to WAV format
export async function convertMp3ToWav(file) {
  const audioBuffer = await decodeMp3(file);
  const wavArrayBuffer = toWav(audioBuffer);
  const wavBase64 = await arrayBufferToBase64(wavArrayBuffer);
  const splitted = wavBase64.split(",")[1];
  return {
    audioBase64: splitted,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  };
}

export async function convertMp3StreamToWav(stream) {
  // Convert the stream to a Blob
  const blob = await new Response(stream).blob();

  // Read the Blob as an ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();

  // Decode the MP3 ArrayBuffer
  const audioBuffer = await decodeMp3Stream(arrayBuffer);

  // Convert the decoded audio to WAV
  const wavArrayBuffer = toWav(audioBuffer);

  // Convert the WAV ArrayBuffer to Base64
  const wavBase64 = await arrayBufferToBase64(wavArrayBuffer);
  const splitted = wavBase64.split(",")[1];

  return {
    audioBase64: splitted,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  };
}

// Convert ArrayBuffer to Base64 (optional)
function arrayBufferToBase64(buffer) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: "audio/wav" });
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
}
