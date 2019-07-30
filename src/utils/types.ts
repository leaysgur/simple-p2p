export interface SignalingDataChannelPayload {
  type: "data-channel";
  data: {
    label: string;
    dcInit: RTCDataChannelInit;
  };
}
export interface SignalingMediaNegotiationPayload {
  type: "media-negotiation";
  data: {
    offer: RTCSessionDescription;
    tidx: number;
  };
}

export type SignalingPayload =
  | SignalingDataChannelPayload
  | SignalingMediaNegotiationPayload;
