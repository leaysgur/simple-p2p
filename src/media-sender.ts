import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:sender");

class Sender extends EventEmitter {
  _stopped: boolean;

  constructor() {
    super();

    this._stopped = false;
  }

  replace(track: MediaStreamTrack) {
    debug("sendMedia()");
    if (!(track instanceof MediaStreamTrack))
      throw new Error("Missing MediaStreamTrack!");
    if (this._stopped) throw new Error("Already stopped sender!");

    this.emit("@replace", track);
  }

  async stop() {
    debug("stop()");
    this._stopped = true;
    return new Promise((resolve, reject) => {
      this.emit("@stop", resolve, reject);
    });
  }
}
export default Sender;
