import _debug from "debug";
import EventEmitter from "eventemitter3";
import { PromisedDataChannel } from "enhanced-datachannel";
import { SignalingPayload, SignalingDataChannelPayload } from "./types";

const debug = _debug("simple-p2p:data-handler");

/**
 * Events
 * @fires DataHandler#channel
 */
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

    this._signaling.on(
      "message",
      async (
        message: SignalingPayload,
        resolve: () => void,
        reject: (err: Error) => void
      ) => {
        if (this._closed) return;
        if (message.type !== "datachannel") return;
        await this._handleMessageEvent(
          message as SignalingDataChannelPayload,
          resolve,
          reject
        );
      }
    );
  }

  get closed() {
    return this._closed;
  }

  close() {
    debug("close()");
    this._closed = true;
  }

  async createChannel(label: string = "", dcInit: RTCDataChannelInit = {}) {
    debug("createChannel()");

    if (this._closed) throw new Error("DataHandler already closed!");

    Object.assign(dcInit, {
      negotiated: true,
      id: this._dataChannelId
    });
    debug(label, dcInit);

    const dc = this._pc.createDataChannel(label, dcInit);
    this._dataChannelId++;

    try {
      await this._signaling.send({
        type: "datachannel",
        data: { label, dcInit }
      });
    } catch (err) {
      debug("remote#createDataChannel() failed", err);
      dc.close();
      throw new Error("Failed to create remote data channel!");
    }

    return dc;
  }

  private async _handleMessageEvent(
    message: SignalingDataChannelPayload,
    resolve: () => void,
    reject: (err: Error) => void
  ) {
    const { label, dcInit } = message.data;

    let dc: RTCDataChannel;
    try {
      dc = this._pc.createDataChannel(label, dcInit);
      this._dataChannelId++;
    } catch (err) {
      return reject(err);
    }

    this.emit("channel", dc);
    resolve();
  }
}

export default DataHandler;
