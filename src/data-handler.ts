import _debug from "debug";
import EventEmitter from "eventemitter3";
import { PromisedDataChannel } from "enhanced-datachannel";

const debug = _debug("simple-p2p:data-handler");

class DataHandler extends EventEmitter {
  _closed: boolean;
  _dataChannelId: number;
  _pc: RTCPeerConnection;
  _signaling: PromisedDataChannel;

  constructor(pc: RTCPeerConnection, signaling: PromisedDataChannel) {
    super();

    this._closed = false;
    this._dataChannelId = 10;

    this._pc = pc;
    this._signaling = signaling;

    // TODO: typings
    this._signaling.on("message", async (data, resolve, reject) => {
      if (data.type !== "datachannel") return;
      await this._handleMessageEvent(data, resolve, reject);
    });
  }

  get closed() {
    return this._closed;
  }

  close() {
    debug("close()");
    this._closed = true;
  }

  async createDataChannel(label: string = "", dcInit: RTCDataChannelInit = {}) {
    debug("createDataChannel()");
    Object.assign(dcInit, {
      negotiated: true,
      id: this._dataChannelId
    });

    const dc = this._pc.createDataChannel(label, dcInit);
    this._dataChannelId++;

    // TODO: close if reject
    await this._signaling.send({
      type: "datachannel",
      data: { label, dcInit }
    });

    return dc;
  }

  private async _handleMessageEvent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (res: any) => void,
    reject: (err: Error) => void
  ) {
    const { label, dcInit } = message.data;

    let dc: RTCDataChannel;
    try {
      dc = this._pc.createDataChannel(label, dcInit);
      this._dataChannelId++;

      resolve(null);
    } catch (err) {
      return reject(err);
    }

    this.emit("data", dc);
  }
}

export default DataHandler;
