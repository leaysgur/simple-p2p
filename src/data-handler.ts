import _debug from "debug";
import EventEmitter from "eventemitter3";
import { PromisedDataChannel } from "enhanced-datachannel";
import { SignalingPayload, SignalingDataChannelPayload } from "./utils/types";

const debug = _debug("simple-p2p:data-handler");

/**
 * Events
 * @fires DataHandler#channel
 */
class DataHandler extends EventEmitter {
  private _closed: boolean;
  private _dataChannelId: number;
  private _pc: RTCPeerConnection;
  private _signaling: PromisedDataChannel;

  constructor(pc: RTCPeerConnection, signaling: PromisedDataChannel) {
    super();

    this._closed = false;
    // increment this for SCTP stream id
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

        switch (message.type) {
          case "data-channel": {
            await this._handleDataChannel(
              message as SignalingDataChannelPayload,
              resolve,
              reject
            );
            break;
          }
        }
      }
    );
  }

  get closed() {
    return this._closed;
  }

  _transportClose() {
    debug("_transportClose()");
    this._closed = true;
  }

  async createChannel(
    label = "",
    dcInit: RTCDataChannelInit = {}
  ): Promise<RTCDataChannel> {
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
        type: "data-channel",
        data: { label, dcInit }
      });
    } catch (err) {
      debug("remote#createDataChannel() failed", err);
      dc.close();
      throw new Error("Failed to create remote data channel!");
    }

    return dc;
  }

  private async _handleDataChannel(
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
