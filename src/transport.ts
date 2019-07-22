import _debug from "debug";
import EventEmitter from "eventemitter3";

const debug = _debug("simple-p2p:transport");

interface NegotiaionSDPPayload {
  type: "offer" | "answer";
  data: RTCSessionDescription;
}
interface NegotiaionCandidaatePayload {
  type: "candidate";
  data: RTCIceCandidate;
}
type NegotiaionPayload = NegotiaionSDPPayload | NegotiaionCandidaatePayload;

class Transport extends EventEmitter {
  _pc: RTCPeerConnection;
  _dc: RTCDataChannel;

  constructor(pc: RTCPeerConnection) {
    super();
    this._pc = pc;
    this._pc.addEventListener("icecandidate", this, false);
    this._pc.addEventListener("iceconnectionstatechange", this, false);
    this._pc.addEventListener("connectionstatechange", this, false);

    this._dc = pc.createDataChannel("", { negotiated: true, id: 0 });
    this._dc.onopen = () => console.warn("OPEN");
  }

  close() {
    this._pc.removeEventListener("icecandidate", this, false);
    this._pc.removeEventListener("iceconnectionstatechange", this, false);
    this._pc.removeEventListener("connectionstatechange", this, false);
    this._pc.close();
  }

  handleEvent(ev: Event) {
    switch (ev.type) {
      case "icecandidate":
        return this._handleCandidateEvent(ev as RTCPeerConnectionIceEvent);
      case "iceconnectionstatechange":
        return this._handleIceConnectionStateChangeEvent();
      case "connectionstatechange":
        return this._handleConnectionStateChangeEvent();
    }
  }

  async startNegotiation(iceRestart = false) {
    debug("startNegotiation()");
    const offer = await this._pc.createOffer({ iceRestart });
    await this._pc.setLocalDescription(offer);

    debug("emit offer SDP");
    debug(offer.sdp);
    this.emit("negotiation", { type: "offer", data: offer });
  }

  async handleNegotiation(payload: NegotiaionPayload) {
    debug("handleNegotiation()");
    switch (payload.type) {
      case "candidate":
        return await this._handleCandidate(payload.data);
      case "offer":
        return await this._handleOffer(payload.data);
      case "answer":
        return await this._handleAnswer(payload.data);
      default:
        debug("Undefined payload, discard", payload);
    }
  }

  async restartIce() {
    debug("restartIce()");
    return this.startNegotiation(true);
  }

  private async _handleOffer(offer: RTCSessionDescription) {
    debug("handle offer SDP");
    if (offer.type !== "offer") {
      throw new Error("Received SDP is not an offer!");
    }

    debug(offer.sdp);
    await Promise.all([
      this._pc.setRemoteDescription(offer),
      this._pc
        .createAnswer()
        .then(answer => this._pc.setLocalDescription(answer))
    ]);

    // must not be happend
    if (this._pc.localDescription === null) {
      throw new Error("Can't generate answer SDP!");
    }

    debug("emit answer SDP");
    debug(this._pc.localDescription.sdp);
    this.emit("negotiation", {
      type: "answer",
      data: this._pc.localDescription
    });
  }

  private async _handleAnswer(answer: RTCSessionDescription) {
    debug("handle answer SDP");
    if (answer.type !== "answer") {
      throw new Error("Received SDP is not an answer!");
    }

    debug(answer.sdp);
    await this._pc.setRemoteDescription(answer);
  }

  private async _handleCandidate(candidate: RTCIceCandidate) {
    debug("handle candidate");
    debug(candidate.candidate);
    await this._pc.addIceCandidate(candidate);
  }

  private _handleCandidateEvent(ev: RTCPeerConnectionIceEvent) {
    if (ev.candidate === null) return;
    // Firefox 68~ emits this but otheres can not recognize...
    if (ev.candidate.candidate === "") return;
    this.emit("negotiation", { type: "candidate", data: ev.candidate });
  }

  private _handleIceConnectionStateChangeEvent() {
    debug("iceConnectionStateChange", this._pc.iceConnectionState);
    this.emit("iceConnectionState", this._pc.iceConnectionState);
  }

  private _handleConnectionStateChangeEvent() {
    debug("connectionStateChange", this._pc.connectionState);
    this.emit("connectionState", this._pc.connectionState);
  }
}

export default Transport;
