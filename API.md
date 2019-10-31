# API

## Exports

- `createTransport(config)`

This module only exports this function.

Argument `config` is a [`RTCConfiguration`](https://w3c.github.io/webrtc-pc/#rtcconfiguration-dictionary) object.
But `bundlePolicy` and `rtcpMuxPolicy` will be ignored.

This function returns `Transport` instance.

## Classes
### Transport

extends `EventEmitter`.

This represents the WebRTC transport holds the peer connection and data channel instance for internal signaling.

#### Props

- `closed`
  - transport closed or not
- `connectionState`
  - current connection state
  - "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed"
- `dataHandler`
  - `DataHandler` instance
- `mediaHandler`
  - `MediaHandler` instance

#### Methods

- async `startNegotiation()`
  - starts negotiation and emits `negotiation` event
- async `handleNegotiation(payload)`
  - handle negotiation payloads emitted by `startNegotiation()` from remote peer
- async `restartIce()`
  - restart ICE connection
- async `getStats()`
  - get transport stats report
- `updateIceServers(iceServers)`
  - update ICE servers
- `close()`
  - close transport

#### Events

- `negotiation`
  - emits with negotiation payloads
- `open`
  - emits after transport connected
- `connectionStateChange`
  - emits with each connection state changes
- `close`
  - emits when transport closed
- `error`
  - emits when error thrown


### DataHandler

extends `EventEmitter`.

This class manages `RTCDataChannel` on base `Transport`.

#### Props

- `closed`
  - transport closed or not

#### Methods

- async `createChannel(label, dcInit)`
  - returns another `RTCDataChannel` instance
  - same arguments for `RTCPeerConnection#createDataChannel()`

#### Events

- `channel`
  - emits `RTCDataChannel` instance which remote peer created

### MediaHandler

extends `EventEmitter`.

This class manages `RTCRtpTransceiver` on base `Transport`.

#### Props

- `closed`
  - transport closed or not

#### Methods

- async `sendTrack(track)`
  - returns `MediaSender` instance
  - `track` is `MediaStreamTrack` instance
  - it also creates `MediaReceiver` on remote `MediaHandler`

#### Events

- `receiver`
  - emits `MediaReceiver` instance which paired with remote `MediaSender`

### MediaSender

extends `EventEmitter`.

Manages `MediaStreamTrack` to send.

#### Props

- `ended`
  - sending ended or not
- `track`
  - sending `MediaStreamTrack`
- `kind`
  - kind of track, `video` or `audio`

#### Methods

- async `replace(newTrack)`
  - replace current track with new one
  - emits `replace` event on remote `MediaReceiver`
- async `end()`
  - end current track sending
  - emits `ended` event on remote `MediaReceiver`
- async `getStats()`
  - get sender stats report
- async `getParameters()`
  - get sender `RTCRtpSendParameters`
- async `updateParameters(updater)`
  - update(get+set) sender `RTCRtpSendParameters`

#### Events

- emits nothing

### MediaReceiver

extends `EventEmitter`.

Manage `MediaStreamTrack` to receive.

#### Props

- `ended`
  - sending ended or not on remote peer
- `track`
  - receiving `MediaStreamTrack`
- `kind`
  - kind of track, `video` or `audio`

#### Methods

- async `getStats()`
  - get receiver stats report

#### Events

- `replace`
  - emits when remote `MediaSender` replaces track
- `ended`
  - emits when remote `MediaSender` ends
