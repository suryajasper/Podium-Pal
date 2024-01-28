import React, {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useImperativeHandle,
} from "react";

const time = 15;

const DynamicTicker = forwardRef((props, ref) => {
  const [texts, setTexts] = useState([]);

  const addText = (newText) => {
    const id = Math.random().toString(); // Unique identifier for each text
    setTexts([...texts, { id, text: newText }]);
  };

  useImperativeHandle(ref, () => ({
    addText,
  }));

  const removeText = (id) => {
    setTexts(texts.filter((t) => t.id !== id));
  };

  const tickerContainerStyle = {
    width: "100%",
    height: "85px",
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div style={tickerContainerStyle}>
      {texts.map(({ text, id }) => {
        return (
          <MovingText key={id} text={text} onComplete={() => removeText(id)} />
        );
      })}
    </div>
  );
});

const MovingText = ({ text, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, time * 1000); // Adjust based on animation duration and delay

    return () => clearTimeout(timer);
  }, [onComplete, text]);

  const movingTextStyle = {
    position: "absolute",
    font: "roboto",
    color: "#65A7E0",
    fontSize: "40px",
    fontWeight: "600",
    width: "3000px",
    animation: `moveText ${time}s linear`,
    marginLeft: "1000px",
    zIndex: "5",
  };

  const keyframes = `@keyframes moveText { from { margin-left: 0px; } to { margin-left: -3000px; } }`;

  return (
    <>
      <style>{keyframes}</style>
      <div style={movingTextStyle}>{text}</div>
    </>
  );
};

export default DynamicTicker;
