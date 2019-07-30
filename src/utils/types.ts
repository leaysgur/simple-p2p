export interface SignalingDataChannelPayload {
  type: "datachannel";
  data: {
    label: string;
    dcInit: RTCDataChannelInit;
  };
}
export interface SignalingOfferPayload {
  type: "mediachannel";
  data: {
    offer: RTCSessionDescription;
    tidx: number;
  };
}

export type SignalingPayload =
  | SignalingDataChannelPayload
  | SignalingOfferPayload;
