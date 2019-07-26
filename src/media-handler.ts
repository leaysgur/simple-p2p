import _debug from "debug";
import EventEmitter from "eventemitter3";
import { PromisedDataChannel } from "enhanced-datachannel";
import { SignalingPayload, SignalingOfferPayload } from "./types";
import MediaSender from "./media-sender";

const debug = _debug("simple-p2p:media-handler");

/**
 * Events
 * @fires MediaHandler#track
 */
class MediaHandler extends EventEmitter {
  _closed: boolean;
  _stream: MediaStream;
  _transceivers: Map<string, RTCRtpTransceiver>;
  _pc: RTCPeerConnection;
  _signaling: PromisedDataChannel;

  constructor(pc: RTCPeerConnection, signaling: PromisedDataChannel) {
    super();

    this._closed = false;
    this._stream = new MediaStream();
    this._transceivers = new Map();

    this._pc = pc;
    this._signaling = signaling;

    this._signaling.on("message", async (
      message: SignalingPayload,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolve: (res?: any) => void,
      reject: (err: Error) => void
    ) => {
      if (this._closed) return;
      if (message.type === "datachannel") return;
      await this._handleMessageEvent(
        message as SignalingOfferPayload,
        resolve,
        reject
      );
    });
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

    await this._startNegotiation();

    const mid = String(transceiver.mid);
    this._transceivers.set(mid, transceiver);

    const sender = new MediaSender();
    this._handleSenderEvent(mid, sender);
    return sender;
  }

  private async _startNegotiation() {
    debug("_startNegotiation()");

    const offer = await this._pc.createOffer();
    await this._pc.setLocalDescription(offer);
    debug(offer.sdp);

    // TODO: rollback if reject
    const answer: RTCSessionDescriptionInit = await this._signaling.send(offer);
    debug(answer.sdp);
    await this._pc.setRemoteDescription(answer);
  }
  private async _handleNegotiation(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescription> {
    debug("_handleNegotiation()");
    debug(offer.sdp);

    // TODO: rollback if fail
    await Promise.all([
      this._pc.setRemoteDescription(offer),
      this._pc
        .createAnswer()
        .then(answer => this._pc.setLocalDescription(answer))
    ]);

    // must not be happend
    if (this._pc.localDescription === null) {
      throw new Error("Can't generate answer SDP!");
    }

    debug("emit answer SDP");
    debug(this._pc.localDescription.sdp);
    return this._pc.localDescription;
  }

  private async _handleMessageEvent(
    message: SignalingOfferPayload,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (res: any) => void,
    reject: (err: Error) => void
  ) {
    try {
      const answer = await this._handleNegotiation(message);
      resolve(answer);
    } catch (err) {
      return reject(err);
    }

    const transceiver = this._pc.getTransceivers().pop();
    // must not be happend
    if (!transceiver) {
      throw new Error("Missing transceiver!");
    }

    if (transceiver.currentDirection === "recvonly") {
      this.emit("track", transceiver.receiver.track);
    }
    // else transceiver inactivated
  }

  private _handleSenderEvent(mid: string, sender: MediaSender) {
    sender.on("@replace", track => {
      const transceiver = this._transceivers.get(mid);
      // must not be happend
      if (!transceiver) {
        throw new Error("Missing transceiver!");
      }

      transceiver.sender.replaceTrack(track);
    });

    sender.on(
      "@close",
      async (resolve: () => void, reject: (err: Error) => void) => {
        const transceiver = this._transceivers.get(mid);
        // must not be happend
        if (!transceiver) {
          throw new Error("Missing transceiver!");
        }

        transceiver.sender.replaceTrack(null);
        this._pc.removeTrack(transceiver.sender);
        // TODO: make whole m-section inactive
        transceiver.direction = "inactive";
        await this._startNegotiation()
          .then(resolve)
          .catch(reject);
      }
    );
  }
}

export default MediaHandler;
