import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:sender");

class Sender extends EventEmitter {
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

  async replace(newTrack: MediaStreamTrack) {
    debug("replace()");

    if (!(newTrack instanceof MediaStreamTrack))
      throw new Error("Missing MediaStreamTrack!");
    if (this._ended) throw new Error("Already ended sender!");

    if (this._track === newTrack)
      throw new Error("Do not need to replace the same track!");
    if (this._track.kind !== newTrack.kind)
      throw new Error("Can not replace different kind of track!");

    await new Promise((resolve, reject) => {
      this.emit("@replace", this._tidx, newTrack, resolve, reject);
    });
    this._track = newTrack;
  }

  async end() {
    debug("end()");

    if (this._ended) throw new Error("Already ended sender!");

    await new Promise((resolve, reject) => {
      this.emit("@end", this._tidx, resolve, reject);
    });
    this._ended = true;
  }

  async getStats() {
    debug("getStats()");

    if (this._ended) throw new Error("Already ended sender!");

    const stats = await new Promise((resolve, reject) => {
      this.emit("@stats", this._tidx, resolve, reject);
    });
    return stats;
  }
}
export default Sender;
