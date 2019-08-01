# simple-p2p

The simple module to achieve P2P communication for modern browsers.

- Chrome 75+
- Firefox 68+
- Safari 12.1.1+

## Install

```
npm i simple-p2p
```

## API overview

See [API](./API.md) for details.

```js
import { createTransport } from "simple-p2p";

const transport = createTransport({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

// you need to do signaling by yourself
signaling.on("signal", data => transport.handleNegotiation(data));
transport.on("negotiation", data => signaling.signal(data));
await transport.startNegotiation();

// wait for transport open
await new Promise(r => transport.once("open", r));

// use DataHandler and/or MediaHandler
const { dataHandler, mediaHandler } = transport;

// when remote createChannel() has called,
dataHandler.on("channel", dc => {});

// returns RTCDataChannel instance
const channel1 = await dataHandler.createChannel();
const channel2 = await dataHandler.createChannel("unreliable", { ordered: false });

// when remote sendTrack() has called,
mediaHandler.on("receiver", mediaReceiver => {
  const { track, kind } = mediaReceiver;

  // render media elements to DOM
  const $media = document.createElement(kind);
  $media.srcObject = new MediaStream([track]);
  document.body.appendChild($media);

  // remove from DOM
  mediaReceiver.on("end", () => $media.remove());
});

const track = await navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => stream.getTracks()[0]);
// returns MediaSender instance
const mediaSender = await mediaHandler.sendTrack(track);

// replace track which has same kind
const newTrack = await navigator.mediaDevices.getDisplayMedia({ video: true })
  .then(stream => stream.getTracks()[0]);
await mediaSender.replace(newTrack);

// end sending track
await mediaSender.end();
```
