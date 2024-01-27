import { useState, useEffect } from "react";
import "../App.css";
import "bootstrap/dist/css/bootstrap.css";
import { Unity, useUnityContext } from "react-unity-webgl";
import { audioGen } from "../utils/audiogen";

function Interview() {
  const [textInput, setTextInput] = useState("");

  const { unityProvider, sendMessage, isLoaded } = useUnityContext({
    loaderUrl: "Build/public.loader.js",
    dataUrl: "Build/public.data.unityweb",
    frameworkUrl: "Build/public.framework.js.unityweb",
    codeUrl: "Build/public.wasm.unityweb",
  });

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3001/events");

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.triggerAudioGen && isLoaded) {
        audioGen(data.body.text)
          .then((audio) => {
            sendMessage("Lipsync", "ReceiveAudio", JSON.stringify(audio));
          })
          .catch((err) => {
            console.error("Error generating audio:", err);
          });
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isLoaded]);

  return (
    <div>
      <Unity unityProvider={unityProvider} style={{ width: 1000 }} />
      <div className="row">
        <div className="col-8">
          <input
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

export default Interview;

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
