import _debug from "debug";
import EventEmitter from "eventemitter3";
import { PromisedDataChannel } from "enhanced-datachannel";
import {
  SignalingPayload,
  SignalingMediaNegotiationPayload,
  SignalingMediaReplacePayload
} from "./utils/types";
import MediaSender from "./media-sender";
import MediaReceiver from "./media-receiver";

const debug = _debug("simple-p2p:media-handler");

/**
 * Events
 * @fires MediaHandler#track
 */
class MediaHandler extends EventEmitter {
  _closed: boolean;
  _stream: MediaStream;
  _senders: Map<number, MediaSender>;
  _receivers: Map<number, MediaReceiver>;
  _pc: RTCPeerConnection;
  _signaling: PromisedDataChannel;

  constructor(pc: RTCPeerConnection, signaling: PromisedDataChannel) {
    super();

    this._closed = false;
    this._stream = new MediaStream();
    this._senders = new Map();
    this._receivers = new Map();
    this._pc = pc;
    this._signaling = signaling;

    this._signaling.on(
      "message",
      async (
        message: SignalingPayload,
        resolve: () => void,
        reject: (err: Error) => void
      ) => {
        if (this._closed) return;

        switch (message.type) {
          case "media-negotiation":
            await this._handleMediaNegotiation(
              message as SignalingMediaNegotiationPayload,
              resolve,
              reject
            );
            break;
          case "media-replace":
            await this._handleMediaReplace(
              message as SignalingMediaReplacePayload,
              resolve,
              reject
            );
            break;
        }
      }
    );
  }

  get closed() {
    return this._closed;
  }

  close() {
    debug("close()");
    this._closed = true;
  }

  async sendTrack(track: MediaStreamTrack) {
    debug("sendTrack()");

    if (!(track instanceof MediaStreamTrack))
      throw new Error("Missing MediaStreamTrack!");
    if (this._closed) throw new Error("MediaHandler already closed!");

    const transceiver = this._pc.addTransceiver(track, {
      direction: "sendonly",
      streams: [this._stream]
    });
    const tidx = this._pc.getTransceivers().indexOf(transceiver);

    const offer = await this._pc.createOffer();

    try {
      await this._startNegotiation(offer, tidx);
    } catch (err) {
      debug("negotiation failed", err);
      // dispose transceiver...
      transceiver.sender.replaceTrack(null);
      this._pc.removeTrack(transceiver.sender);
      transceiver.direction = "inactive";

      throw new Error("Remote handler failed to receive track!");
    }

    const sender = new MediaSender(track, tidx);
    this._senders.set(tidx, sender);
    this._handleSenderEvent(sender);
    return sender;
  }

  private async _startNegotiation(
    offer: RTCSessionDescriptionInit,
    affectedTIdx: number
  ) {
    debug(`_startNegotiation() for tidx: ${affectedTIdx}`);

    await this._pc.setLocalDescription(offer);
    // must not be happend
    if (this._pc.localDescription === null)
      throw new Error("Can't generate offer SDP!");

    debug("send offer");
    debug(this._pc.localDescription.sdp);

    try {
      const answer: RTCSessionDescriptionInit = await this._signaling.send({
        type: "media-negotiation",
        data: { offer: this._pc.localDescription, tidx: affectedTIdx }
      });

      debug("recv answer");
      debug(answer.sdp);
      await this._pc.setRemoteDescription(answer);
    } catch (err) {
      // answer not responded
      debug("can not get answer back", err);
      throw err;
    }
  }

  private async _handleMediaNegotiation(
    message: SignalingMediaNegotiationPayload,
    resolve: (res: RTCSessionDescription) => void,
    reject: (err: Error) => void
  ) {
    const { offer, tidx } = message.data;
    debug(`_handleMediaNegotiation() for tidx: ${tidx}`);

    debug("handle offer SDP");
    debug(offer.sdp);

    try {
      await Promise.all([
        this._pc.setRemoteDescription(offer),
        this._pc
          .createAnswer()
          .then(answer => this._pc.setLocalDescription(answer))
      ]);
    } catch (err) {
      debug("sRD failed", err);
      // sRD failed = can not send back answer
      return reject(err);
    }

    // must not be happend
    if (this._pc.localDescription === null)
      return reject(new Error("Can't generate answer SDP!"));

    const transceiver = this._pc.getTransceivers()[tidx];
    // must not be happend
    if (!transceiver) return reject(new Error("Missing transceiver!"));

    if (transceiver.currentDirection === "recvonly") {
      const receiver = new MediaReceiver(transceiver.receiver.track, tidx);
      this._receivers.set(tidx, receiver);
      this.emit("receiver", receiver);
    }
    if (transceiver.currentDirection === "inactive") {
      const receiver = this._receivers.get(tidx);
      if (!receiver) return reject(new Error("Missing receiver!"));
      receiver.emit("close");
    }

    debug("emit answer SDP");
    debug(this._pc.localDescription.sdp);
    resolve(this._pc.localDescription);
  }

  private _handleMediaReplace(
    message: SignalingMediaReplacePayload,
    resolve: () => void,
    reject: (err: Error) => void
  ) {
    const { tidx } = message.data;
    debug(`_handleMediaReplace() for tidx: ${tidx}`);

    const receiver = this._receivers.get(tidx);
    if (!receiver) return reject(new Error("Missing receiver!"));
    receiver.emit("replace");

    resolve();
  }

  private _handleSenderEvent(sender: MediaSender) {
    sender.on(
      "@replace",
      async (
        tidx: number,
        track: MediaStreamTrack,
        resolve: () => void,
        reject: (err: Error) => void
      ) => {
        const transceiver = this._pc.getTransceivers()[tidx];
        // must not be happend
        if (!transceiver) return reject(new Error("Missing transceiver!"));

        await Promise.all([
          transceiver.sender.replaceTrack(track),
          this._signaling.send({
            type: "media-replace",
            data: { tidx }
          })
        ])
          .then(resolve)
          .catch(reject);
      }
    );

    sender.on(
      "@close",
      async (
        tidx: number,
        resolve: () => void,
        reject: (err: Error) => void
      ) => {
        const transceiver = this._pc.getTransceivers()[tidx];
        // must not be happend
        if (!transceiver) return reject(new Error("Missing transceiver!"));

        transceiver.sender.replaceTrack(null);
        this._pc.removeTrack(transceiver.sender);
        transceiver.direction = "inactive";

        const offer = await this._pc.createOffer();
        await this._startNegotiation(offer, tidx)
          .then(resolve)
          .catch(reject);
      }
    );
  }
}

export default MediaHandler;
