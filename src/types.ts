export interface SignalingDataChannelPayload {
  type: "datachannel";
  data: {
    label: string;
    dcInit: RTCDataChannelInit;
  };
}
export interface SignalingOfferPayload {
  type: "offer";
}

export type SignalingPayload =
  | SignalingDataChannelPayload
  | SignalingOfferPayload;
