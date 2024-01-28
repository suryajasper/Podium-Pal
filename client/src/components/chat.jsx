import React from "react";
import { MessageList } from "react-chat-elements";
import "react-chat-elements/dist/main.css";

export function Chat({ messages }) {
  const messageListReference = React.createRef();

  return (
    <div style={{ marginTop: "20px", height: 200 }}>
      <MessageList
        style={{ overflow: "scroll" }}
        className="message-list"
        lockable={true}
        toBottomHeight={"100%"}
        dataSource={messages}
      />
    </div>
  );
}
