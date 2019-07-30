# simple-p2p

The simple module to achieve P2P communication for modern browsers.

- Chrome 75+
- Firefox 68+
- Safari 12.1.1+

## Install

```
npm i simple-p2p
```

## API

- `createTransport(config)`

This module only exports this function.

### createTransport(config)

```js
import { createTransport } from "simple-p2p";

const transport = createTransport({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});
```

`config` is a [`RTCConfiguration`](https://w3c.github.io/webrtc-pc/#rtcconfiguration-dictionary) object.
But `bundlePolicy` and `rtcpMuxPolicy` will be ignored.

This function returns `Transport` instance.

## Docs
### Transport

extends `EventEmitter`.

```js
const transport = createTransport();

// signaling by yourself
signaling.on("signal", data => transport.handleNegotiation(data));
transport.on("negotiation", data => signaling.signal(data));
await transport.startNegotiation();

// other events
transport.on("open", () => {});
transport.on("connectionStateChange", state => {});
transport.on("close", () => {});
transport.on("error", err => {});

// props
const { closed, connectionState } = transport;

// restart ICE
await transport1.restartIce();
// get RTCStatsReport for whole transport
const stats = await transport1.getStats();
// close
transport1.close();

// DataHandler and MediaHandler
const { dataHandler, mediaHandler } = transport;
```

This `Transport` represents the WebRTC transport holds the peer connection.

### DataHandler

extends `EventEmitter`.

```js
const { dataHandler } = transport;

// props
const { closed } = dataHandler;

// when remote createChannel() has called,
dataHandler.on("channel", channel => {});

// returns RTCDataChannel instance
const channel1 = await dataHandler.createChannel();
const channel2 = await dataHandler.createChannel("unreliable", { ordered: false });
```

This class creates `RTCDataChannel` instance on base `Transport`.

### MediaHandler

extends `EventEmitter`.

```js
const { mediaHandler } = transport;

// props
const { closed } = mediaHandler;

// when remote sendTrack() has called,
mediaHandler.on("receiver", mediaReceiver => {});

// returns MediaSender instance
const mediaSender = await mediaHandler.sendTrack(track);
```

This class creates `RTCDataChannel` instance on base `Transport`.


### MediaSender

extends `EventEmitter`.

```js
const mediaSender = await mediaHandler.sendTrack(track);

// props
const { ended, track } = mediaSender;

// replace track which has same kind
await mediaSender.replace(newTrack);
// end sending track
await mediaSender.end();
// get RTCStatsReport for sender
await mediaSender.getStats();
```

Manage `MediaStreamTrack` to send.

### MediaReceiver

extends `EventEmitter`.

```js
mediaHandler.on("receiver", mediaReceiver => {
  // props
  const { ended, track } = mediaReceiver;

  // events
  mediaReceiver.on("ended", () => {});
  mediaReceiver.on("replace", () => {});

  // get RTCStatsReport for sender
  await mediaSender.getStats();
});
```

Manage `MediaStreamTrack` to receive.
