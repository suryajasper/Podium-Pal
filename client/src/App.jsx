import { useState, useEffect, useRef } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.css";
import { Unity, useUnityContext } from "react-unity-webgl";
import { processAudio } from "./utils/audio";
import { convertMp3ToWav, convertMp3StreamToWav } from "./utils/mp3towav";
function App() {
  const [textInput, setTextInput] = useState();
  const { unityProvider, sendMessage } = useUnityContext({
    loaderUrl: "Build/public.loader.js",
    dataUrl: "Build/public.data.unityweb",
    frameworkUrl: "Build/public.framework.js.unityweb",
    codeUrl: "Build/public.wasm.unityweb",
  });
  const inputRef = useRef(null);
  const options = {
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
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3001/events");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.triggerAudioGen) {
        audioGen(data.body.text);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);
  const audioGen = (text = "hello world") => {
    let newOptions = options;
    let body = JSON.parse(options.body);
    body.text = text;
    newOptions.body = JSON.stringify(body);

    fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/GBv7mTt0atIp3Br8iCZE",
      newOptions
    )
      .then(async (response) => {
        const audioInfoJson = await convertMp3StreamToWav(response.body);
        console.log(audioInfoJson);
        sendMessage("Lipsync", "ReceiveAudio", JSON.stringify(audioInfoJson));
      })
      .catch((err) => console.error(err));
  };
  useEffect(() => {
    const unityContainer = document.getElementById("unity-container");

    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    if (unityContainer) {
      unityContainer.addEventListener("click", handleClick);
    }

    return () => {
      if (unityContainer) {
        unityContainer.removeEventListener("click", handleClick);
      }
    };
  }, []);

  return (
    <div>
      <Unity unityProvider={unityProvider} style={{ width: 1000 }} />
      <div className="row">
        <div className="col-8">
          <input
            ref={inputRef}
            type="text"
            value={textInput || ""}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text for audio generation"
            style={{
              width: "100%",
              height: "50px",
              fontSize: "20px",
              padding: "10px",
            }}
          />
        </div>
        <div className="col-4">
          <button
            onClick={audioGen}
            style={{
              width: "100%",
              height: "50px",
              fontSize: "20px",
              padding: "10px",
              backgroundColor: "#aaaaff",
            }}>
            Audio Gen
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

/*<button onClick={replay}>Replay</button>
     <input type="file" id="audioInput" accept="audio/*" />
        <button onClick={sendAudioToUnity}>Send Audio to Unity</button>
       
 async function sendAudioToUnity() {
    const fileInput = document.getElementById("audioInput");
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      let audioInfoJson;
      if (file.type === "audio/wav") {
        audioInfoJson = await processAudio(file);
      } else if (file.type === "audio/mpeg") {
        audioInfoJson = await convertMp3ToWav(file);
      } else {
        console.error("Unsupported audio format");
        return;
      }

      sendMessage("Lipsync", "ReceiveAudio", JSON.stringify(audioInfoJson));
    } else {
      console.error("No file selected");
    }
  }
  const replay = () => {
    sendMessage("Lipsync", "Replay");
  };

*/
