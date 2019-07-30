import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:sender");

class Sender extends EventEmitter {
  _closed: boolean;
  _track: MediaStreamTrack;

  constructor(track: MediaStreamTrack) {
    super();

    this._closed = false;
    this._track = track;
  }

  get closed() {
    return this._closed;
  }

  get track() {
    return this._track;
  }

  async replace(newTrack: MediaStreamTrack) {
    debug("sendMedia()");

    if (!(newTrack instanceof MediaStreamTrack))
      throw new Error("Missing MediaStreamTrack!");
    if (this._closed) throw new Error("Already closed sender!");

    if (this._track === newTrack)
      throw new Error("Do not need to replace the same track!");
    if (this._track.kind !== newTrack.kind)
      throw new Error("Can not replace different kind of track!");

    return new Promise((resolve, reject) => {
      this.emit("@replace", newTrack, resolve, reject);
    });
  }

  async close() {
    debug("close()");

    if (this._closed) throw new Error("Already closed sender!");

    this._closed = true;
    return new Promise((resolve, reject) => {
      this.emit("@close", resolve, reject);
    });
  }
}
export default Sender;
