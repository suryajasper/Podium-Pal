import React from "react";
import { MessageList } from "react-chat-elements";
import "react-chat-elements/dist/main.css";
import me from "../assets/me.png";
import person from "../assets/person.jpg";
export function Chat() {
  const messageListReference = React.createRef();

  return (
    <div style={{ marginTop: "20px" }}>
      <MessageList
        className="message-list"
        lockable={true}
        toBottomHeight={"100%"}
        dataSource={[
          {
            position: "left",
            type: "text",
            title: "Kiyo",
            text: "Give me a message list example !",
            avatar: me,
          },
          {
            position: "right",
            type: "text",
            title: "Emre",
            text: "That's all.",
            avatar: person, // URL of Emre's avatar image
          },
        ]}
      />
    </div>
  );
}
