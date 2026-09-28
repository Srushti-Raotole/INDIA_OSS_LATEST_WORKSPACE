import React from "react";

const NAVBAR_HEIGHT = "5vh";

interface Props {
  src: string;
  title: string;
}

const EPNMIframe: React.FC<Props> = ({ src, title }) => {
  return (
    <div
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT})`,
        width: "100%",           
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <iframe
        title={title}
        src={src}
        style={{
          border: "none",
          height: "100%",
          width: "100%",      
          display: "block",
        }}
        loading="lazy"
        scrolling="yes"
        allowFullScreen
      />
    </div>
  );
};

export default EPNMIframe;
