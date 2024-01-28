import { useState, useEffect, useRef } from "react";
import "../App.css";
import "bootstrap/dist/css/bootstrap.css";
import { Unity, useUnityContext } from "react-unity-webgl";
import { audioGen } from "../utils/audiogen";
import DynamicTicker from "../components/ticker";
import end from "../assets/end.png";
import mute from "../assets/mute.png";
import chat from "../assets/chat.png";
import unmute from "../assets/unmute.png";
import unchat from "../assets/unchat.png";
import { BgVid } from "../components/bgvid";
function Interview() {
  const { unityProvider, sendMessage, isLoaded } = useUnityContext({
    loaderUrl: "Build/public.loader.js",
    dataUrl: "Build/public.data.unityweb",
    frameworkUrl: "Build/public.framework.js.unityweb",
    codeUrl: "Build/public.wasm.unityweb",
  });
  let [isChat, setChat] = useState(false);
  let [isMute, setMute] = useState(true);
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:3001/events");

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.triggerAudioGen && isLoaded) {
        audioGen(data.body.text)
          .then((audio) => {
            sendMessage("Lipsync", "ReceiveAudio", JSON.stringify(audio));
            addText(data.body.text);
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
  const tickerRef = useRef();

  const addText = (text) => {
    tickerRef.current.addText(text);
  };
  const togMute = () => {
    setMute(!isMute);
  };
  const togChat = () => {
    if (isChat) {
      sendMessage("business", "TriggerLeft");
    } else {
      sendMessage("business", "TriggerRight");
    }
    setChat(!isChat);
  };
  return (
    <>
      <BgVid />
      <div
        style={{
          position: "absolute",
          display: "flex",
          width: isChat ? "60vw" : "100vw",
          justifyContent: "center",
          height: "100%",
          top: 0,
          background: "none",
          transition: "width 1s ease-in-out",
        }}>
        <div
          style={{
            width: 1050,
            paddingTop: 25,
            marginTop: 75,
            paddingBottom: 100,
            backgroundColor: "#dddddd",
            position: "absolute",
            borderRadius: 25,
            boxShadow: "0px 0px 20px 0px #99bbdd",
          }}>
          <div
            style={{ position: "absolute", width: 1000, bottom: 0, zIndex: 1 }}>
            <DynamicTicker ref={tickerRef} />
          </div>
          <div
            className="row"
            style={{
              position: "absolute",
              marginTop: "515px",
              width: 1075,
              display: "flex",
              justifyContent: "center",
            }}>
            <div></div>
            <div className="col-4" style={{ height: 100 }}>
              <img
                src={isChat ? chat : unchat}
                onClick={togChat}
                className="vid"
              />
            </div>
            <div className="col-4">
              <img
                src={isMute ? mute : unmute}
                onClick={togMute}
                className="vid"
              />
            </div>
            <div className="col-4">
              <img
                src={end}
                className="vid"
                onClick={() => alert("exit session?")}
              />
            </div>
          </div>

          <Unity
            unityProvider={unityProvider}
            style={{ borderRadius: 30, width: 1000, height: 500, zIndex: 5 }}
          />
        </div>
      </div>
    </>
  );
}

export default Interview;

/*const [textInput, setTextInput] = useState("");
<button onClick={replay}>Replay</button>
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
*/
