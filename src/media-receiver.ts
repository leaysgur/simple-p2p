// import _debug from "debug";
import EventEmitter from "eventemitter3";

// const debug = _debug("simple-p2p:receiver");

/**
 * Events
 * @fires MediaHandler#close
 */
class Receiver extends EventEmitter {
  _track: MediaStreamTrack;
  _mid: string;

  constructor(track: MediaStreamTrack, mid: string) {
    super();

    this._track = track;
    this._mid = mid;
  }

  get track() {
    return this._track;
  }
}

export default Receiver;
