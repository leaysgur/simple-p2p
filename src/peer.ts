import _debug from "debug";
import EventEmitter from "eventemitter3";
import { promised, PromisedDataChannel } from "enhanced-datachannel";
import Sender from "./sender";

const debug = _debug("simple-p2p:peer");

class Peer extends EventEmitter {
  _closed: boolean;
  _stream: MediaStream;
  _transceivers: Map<string, RTCRtpTransceiver>;
  _pc: RTCPeerConnection;
  _pdc: PromisedDataChannel;

  constructor(pc: RTCPeerConnection, dc: RTCDataChannel) {
    super();

    this._closed = false;
    this._stream = new MediaStream();
    this._transceivers = new Map();

    this._pc = pc;
    this._pdc = promised(dc);

    this._pdc.on("open", () => this._handleOpenEvent());
    this._pdc.on(
      "message",
      async (data, resolve, reject) =>
        await this._handleMessageEvent(data, resolve, reject)
    );
    this._pdc.on("close", () => this._handleCloseEvent());
    this._pdc.on("error", err => this._handleErrorEvent(err));
  }

  get closed() {
    return this._closed;
  }

  async sendMedia(track: MediaStreamTrack) {
    debug("sendMedia()");

    if (!(track instanceof MediaStreamTrack))
      throw new Error("Missing MediaStreamTrack!");
    if (this._closed) throw new Error("Peer already closed!");

    const transceiver = this._pc.addTransceiver(track, {
      direction: "sendonly",
      streams: [this._stream]
    });
    await this._startNegotiation();

    const mid = String(transceiver.mid);
    this._transceivers.set(mid, transceiver);

    const sender = new Sender();
    this._handleSenderEvent(mid, sender);
    return sender;
  }

  private async _startNegotiation() {
    debug("_startNegotiation()");
    const offer = await this._pc.createOffer();
    await this._pc.setLocalDescription(offer);
    debug(offer.sdp);

    // TODO: rollback if reject
    const answer: RTCSessionDescriptionInit = await this._pdc.send(offer);
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

  private _handleOpenEvent() {
    this.emit("open");
  }
  private async _handleMessageEvent(
    data: RTCSessionDescriptionInit,
    resolve: (answer: RTCSessionDescriptionInit) => void,
    reject: (err: Error) => void
  ) {
    try {
      const answer = await this._handleNegotiation(data);
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
      this.emit("media", transceiver.receiver.track);
    }
    // else inactivated transceiver
  }
  private _handleCloseEvent() {
    this._closed = true;
    this.emit("close");
  }
  private _handleErrorEvent(err: Error) {
    this.emit("error", err);
  }

  private _handleSenderEvent(mid: string, sender: Sender) {
    sender.on("@replace", track => {
      debug("sender.replace()");
      const transceiver = this._transceivers.get(mid);
      // must not be happend
      if (!transceiver) {
        throw new Error("Missing transceiver!");
      }

      transceiver.sender.replaceTrack(track);
    });

    sender.on(
      "@stop",
      async (resolve: () => void, reject: (err: Error) => void) => {
        debug("sender.stop()");
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

export default Peer;
