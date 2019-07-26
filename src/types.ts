export interface SignalingDataChannelPayload {
  type: "datachannel";
  data: {
    label: string;
    dcInit: RTCDataChannelInit;
  };
}
export interface SignalingOfferPayload extends RTCSessionDescriptionInit {
  type: "offer";
}

export type SignalingPayload =
  | SignalingDataChannelPayload
  | SignalingOfferPayload;
