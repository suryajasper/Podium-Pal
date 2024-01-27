const express = require("express");
const server = express();
const cors = require("cors");
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";
require("dotenv/config");
let clients = [];
server.use(cors());
server.use(express.json());
server.use(
  express.urlencoded({
    extended: true,
  })
);
console.log(process.env.ELEVEN_APIKEY);
server.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

server.post("/audiogen", (req, res) => {
  const params = req.body; // Access data sent in the request body
  console.log(params); // Use or log the received parameters
  const jsonData = JSON.stringify({
    triggerAudioGen: true,
    body: { text: req.body.text },
  });
  clients.forEach((client) => client.write(`data: ${jsonData}\n\n`));
  res.status(200).send("Triggered audioGen with parameters");
});
// Start the API server
server.listen(PORT, () => console.log("Local app listening"));
