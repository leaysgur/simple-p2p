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
  _tidx: number;

  constructor(track: MediaStreamTrack, tidx: number) {
    super();

    this._ended = false;
    this._track = track;
    this._tidx = tidx;
  }

  get ended() {
    return this._ended;
  }

  get track() {
    return this._track;
  }

  async getStats() {
    debug("getStats()");

    if (this._ended) throw new Error("Already ended receiver!");

    const stats = await new Promise((resolve, reject) => {
      this.emit("@stats", this._tidx, resolve, reject);
    });
    return stats;
  }

  _endedBySender() {
    debug("_endedBySender()");

    this._ended = true;
    this.emit("ended");
  }
}

export default Receiver;
