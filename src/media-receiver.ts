import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:receiver");

/**
 * Events
 * @fires MediaHandler#replace
 * @fires MediaHandler#end
 */
class Receiver extends EventEmitter {
  _ended: boolean;
  _track: MediaStreamTrack;
  _tdix: number;

  constructor(track: MediaStreamTrack, tdix: number) {
    super();

    this._ended = false;
    this._track = track;
    this._tdix = tdix;
  }

  get ended() {
    return this._ended;
  }

  get track() {
    return this._track;
  }

  _endedBySender() {
    debug("_endedBySender()");

    this._ended = true;
    this.emit("ended");
  }
}

export default Receiver;
