// import _debug from "debug";
import EventEmitter from "eventemitter3";

// const debug = _debug("simple-p2p:receiver");

/**
 * Events
 * @fires MediaHandler#close
 */
class Receiver extends EventEmitter {
  _track: MediaStreamTrack;
  _tdix: number;

  constructor(track: MediaStreamTrack, tdix: number) {
    super();

    this._track = track;
    this._tdix = tdix;
  }

  get track() {
    return this._track;
  }
}

export default Receiver;
