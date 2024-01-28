import React, { useRef, useEffect } from "react";
import bg from "../assets/bg1.mp4";

export const BgVid = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
  }, []);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden", // Hide any overflow
          zIndex: -2,
        }}>
        <video
          autoPlay
          loop
          muted
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover", // Ensure the video covers the whole container
          }}>
          <source src={bg} type="video/mp4" />
        </video>
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          backgroundColor: "rgba(16,16,16,0.7)",
        }}></div>
    </>
  );
};
