import _debug from "debug";
import EventEmitter from "eventemitter3";
import { promised, PromisedDataChannel } from "enhanced-datachannel";

const debug = _debug("simple-p2p:peer");

class Peer extends EventEmitter {
  _pc: RTCPeerConnection;
  _pdc: PromisedDataChannel;

  constructor(pc: RTCPeerConnection, dc: RTCDataChannel) {
    super();

    this._pc = pc;
    this._pdc = promised(dc);

    debug("created!");
  }
}

export default Peer;
