# simple-p2p

The simple module to achieve WebRTC P2P communication for modern browsers.

- Chrome 75+
- Firefox 68+
- Safari 12.1.1+

## Install

```
npm i simple-p2p
```

Type defenitions are included.

## API overview

See [API](./API.md) for details.

### Set up Transport

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
```

### Send media

```js`
const { mediaHandler } = transport;

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

### Receive media`

```js`
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
```

### Use Data channel

```js`
const { dataHandler } = transport;

// when remote createChannel() has called,
dataHandler.on("channel", dc => {});

// returns RTCDataChannel instance
const channel1 = await dataHandler.createChannel();
const channel2 = await dataHandler.createChannel("unreliable", { ordered: false });

channel1.addEventListener("message", msg => {});
channel1.send("Hello");
```
