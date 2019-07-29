import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:sender");

class Sender extends EventEmitter {
  _closed: boolean;

  constructor() {
    super();

    this._closed = false;
  }

  get closed() {
    return this._closed;
  }

  replace(track: MediaStreamTrack) {
    debug("sendMedia()");

    if (!(track instanceof MediaStreamTrack))
      throw new Error("Missing MediaStreamTrack!");
    if (this._closed) throw new Error("Already closed sender!");

    this.emit("@replace", track);
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
