import _debug from "debug";
import EventEmitter from "eventemitter3";
import { promised, PromisedDataChannel } from "enhanced-datachannel";

const debug = _debug("simple-p2p:peer");

class Peer extends EventEmitter {
  _closed: boolean;
  _pc: RTCPeerConnection;
  _pdc: PromisedDataChannel;

  constructor(pc: RTCPeerConnection, dc: RTCDataChannel) {
    super();

    this._closed = false;

    this._pc = pc;
    this._pdc = promised(dc);

    this._pdc.on("open", () => this._handleOpenEvent());
    this._pdc.on("close", () => this._handleCloseEvent());
    // this._pdc.on("error", err => this._handleErrorEvent(err));
  }

  get closed() {
    return this._closed;
  }

  async sendMedia() {
    debug("sendMedia()");
    if (this._closed) throw new Error("Closed!");
  }

  private _handleOpenEvent() {
    this.emit("open");
  }
  private _handleCloseEvent() {
    this._closed = true;
    this.emit("close");
  }
  // private _handleErrorEvent(err: Error) {
  //   this.emit("error", err);
  // }
}

export default Peer;
