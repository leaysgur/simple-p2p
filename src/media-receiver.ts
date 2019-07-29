// import _debug from "debug";
import EventEmitter from "eventemitter3";

// const debug = _debug("simple-p2p:receiver");

/**
 * Events
 * @fires MediaHandler#close
 */
class Receiver extends EventEmitter {
  _track: MediaStreamTrack;

  constructor(track: MediaStreamTrack) {
    super();

    this._track = track;
  }

  get track() {
    return this._track;
  }
}

export default Receiver;
