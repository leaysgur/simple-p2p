export interface SignalingDataChannelPayload {
  type: "datachannel";
  data: {
    label: string;
    dcInit: RTCDataChannelInit;
  };
}
export interface SignalingOfferPayload {
  type: "mediachannel";
  data: RTCSessionDescription;
}

export type SignalingPayload =
  | SignalingDataChannelPayload
  | SignalingOfferPayload;
