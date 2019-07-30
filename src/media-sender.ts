import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:sender");

class Sender extends EventEmitter {
  _closed: boolean;
  _track: MediaStreamTrack;
  _tidx: number;

  constructor(track: MediaStreamTrack, tidx: number) {
    super();

    this._closed = false;
    this._track = track;
    this._tidx = tidx;
  }

  get closed() {
    return this._closed;
  }

  get track() {
    return this._track;
  }

  async replace(newTrack: MediaStreamTrack) {
    debug("replace()");

    if (!(newTrack instanceof MediaStreamTrack))
      throw new Error("Missing MediaStreamTrack!");
    if (this._closed) throw new Error("Already closed sender!");

    if (this._track === newTrack)
      throw new Error("Do not need to replace the same track!");
    if (this._track.kind !== newTrack.kind)
      throw new Error("Can not replace different kind of track!");

    await new Promise((resolve, reject) => {
      this.emit("@replace", this._tidx, newTrack, resolve, reject);
    });
    this._track = newTrack;
  }

  async close() {
    debug("close()");

    if (this._closed) throw new Error("Already closed sender!");

    await new Promise((resolve, reject) => {
      this.emit("@close", this._tidx, resolve, reject);
    });
    this._closed = true;
  }
}
export default Sender;
