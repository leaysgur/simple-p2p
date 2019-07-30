import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:receiver");

/**
 * Events
 * @fires MediaHandler#replace
 * @fires MediaHandler#close
 */
class Receiver extends EventEmitter {
  _closed: boolean;
  _track: MediaStreamTrack;
  _tdix: number;

  constructor(track: MediaStreamTrack, tdix: number) {
    super();

    this._closed = false;
    this._track = track;
    this._tdix = tdix;
  }

  get closed() {
    return this._closed;
  }

  get track() {
    return this._track;
  }

  _closeBySender() {
    debug("_closeBySender()");

    this._closed = true;
    this.emit("close");
  }
}

export default Receiver;
