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
import happy from "../assets/happy.png";
import sad from "../assets/sad.png";
import neutral from "../assets/neutral.png";
import angry from "../assets/angry.png";
import me from "../assets/me.png";
import person from "../assets/person.jpg";
import unchat from "../assets/unchat.png";
import { BgVid } from "../components/bgvid";
import { Chat } from "../components/chat";
function Interview() {
  const { unityProvider, sendMessage, isLoaded } = useUnityContext({
    loaderUrl: "Build/public.loader.js",
    dataUrl: "Build/public.data.unityweb",
    frameworkUrl: "Build/public.framework.js.unityweb",
    codeUrl: "Build/public.wasm.unityweb",
  });
  let [textInput, setTextInput] = useState("");
  let [isChat, setChat] = useState(false);
  let [chatMessages, setChatMessages] = useState([
    {
      position: "left",
      type: "text",
      title: "Kiyo",
      text: "Give me a message list example !",
      avatar: me,
    },
  ]);
  let [isMute, setMute] = useState(true);
  let [tab, setTab] = useState(false);
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
  const setHappy = () => {
    sendMessage("business", "HappyTrigger");
  };
  const setSad = () => {
    sendMessage("business", "SadTrigger");
  };
  const setAngry = () => {
    sendMessage("business", "AngryTrigger");
  };
  const setNeutral = () => {
    sendMessage("business", "TriggerReset");
  };
  const togTab = () => {
    setTab(!tab);
  };
  const togChat = () => {
    if (isChat) {
      sendMessage("business", "TriggerLeft");
    } else {
      sendMessage("business", "TriggerRight");
    }
    setChat(!isChat);
  };
  const handleLeave = () => {
    alert("Leave the chat?");
  };
  const handleChat = () => {
    setChatMessages((prev) => {
      return [
        ...prev,
        {
          position: "right",
          type: "text",
          title: "User",
          text: textInput,
          avatar: person,
        },
      ];
    });
  };
  return (
    <>
      <BgVid />
      <div
        style={{
          position: "absolute",
          display: "flex",
          width: isChat ? "63vw" : "100vw",
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
            style={{
              position: "absolute",
              marginLeft: 25,
              width: 1000,
              bottom: 100,
              zIndex: 1,
            }}>
            <DynamicTicker ref={tickerRef} />
          </div>
          {tab ? (
            <>
              <div
                className="row"
                style={{
                  position: "absolute",
                  marginTop: "435px",
                  width: 300,
                  marginLeft: 705,
                  display: "flex",
                  justifyContent: "center",
                }}>
                <div></div>
                <div className="col-3" style={{ height: 100 }}>
                  <img src={neutral} onClick={setNeutral} className="vid1" />
                </div>
                <div className="col-3">
                  <img src={happy} onClick={setHappy} className="vid1" />
                </div>
                <div className="col-3">
                  <img src={sad} className="vid1" onClick={setSad} />
                </div>
                <div className="col-3">
                  <img src={angry} className="vid1" onClick={setAngry} />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  zIndex: 3,
                  width: 340,
                  height: 85,
                  marginTop: 415,
                  marginLeft: 685,
                  borderTopLeftRadius: 35,
                  borderBottomRightRadius: 30,
                  backgroundColor: "#33323c",
                }}></div>
            </>
          ) : (
            <></>
          )}

          <div
            onClick={togTab}
            style={{
              position: "absolute",
              zIndex: 3,
              width: 60,
              height: 30,
              marginTop: tab ? 385 : 470,
              marginLeft: 900,
              borderTopLeftRadius: 5,
              borderTopRightRadius: 5,
              color: "white",
              paddingTop: 3,
              fontWeight: "700",
              backgroundColor: "#33323c",
            }}>
            ▲
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
              <img src={end} className="vid" onClick={handleLeave} />
            </div>
          </div>

          <Unity
            unityProvider={unityProvider}
            style={{ borderRadius: 30, width: 1000, height: 500, zIndex: 5 }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          //display: isChat ? "flex" : "none",
          width: "30vw",
          marginLeft: isChat ? "70vw" : "100vw",
          transition: "margin-left 1.5s ease-in-out",
          justifyContent: "center",
          height: "835px",
          top: 0,
          background: "none",
        }}>
        <div
          style={{
            transform: isChat ? "rotate(-15deg)" : "rotate(0deg)",
            transition: "transform 1.5s ease-in-out",
            width: 500,
            paddingTop: 25,
            position: "relative",
            marginTop: 75,
            paddingBottom: 100,
            backgroundColor: "#dddddd",
            borderRadius: 25,
            boxShadow: "0px 0px 20px 0px #99bbdd",
          }}>
          <div
            key="del"
            className="row"
            style={{
              marginLeft: 35,
              width: "430px",
              marginTop: 630,
              position: "absolute",
            }}>
            <div className="col-8">
              <input
                type="text"
                value={textInput || ""}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Text Something..."
                style={{
                  width: "100%",
                  height: "50px",
                  fontSize: "20px",
                  bottom: 0,
                  padding: "10px",
                }}
              />
            </div>
            <div className="col-4">
              <button
                onClick={handleChat}
                style={{
                  width: "100%",
                  height: "50px",
                  fontSize: "20px",
                  padding: "10px",
                  backgroundColor: "#aaaaff",
                }}>
                Send
              </button>
            </div>
          </div>
          <div
            style={{
              borderRadius: 30,
              width: 450,
              height: 710,
              marginLeft: 25,
              backgroundColor: "#33323c",
              zIndex: 5,
            }}>
            <div
              style={{
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                width: 450,
                height: 70,
                backgroundColor: "#a6b1be",
                zIndex: 5,
              }}>
              <h2 style={{ paddingTop: "13px" }}>Live Chat</h2>
            </div>
            <Chat messages={chatMessages} />
            */
          </div>
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
