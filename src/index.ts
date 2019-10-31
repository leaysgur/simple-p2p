import _debug from "debug";
import Transport from "./transport";
import DataHandler from "./data-handler";
import MediaHandler from "./media-handler";
import MediaSender from "./media-sender";
import MediaReceiver from "./media-receiver";

const debug = _debug("simple-p2p");

export function createTransport(
  configuration: RTCConfiguration = {}
): Transport {
  Object.assign(configuration, {
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require"
  });
  debug("create RTCPeerConnection w/", configuration);
  const pc = new RTCPeerConnection(configuration);

  return new Transport(pc);
}

export type Transport = InstanceType<typeof Transport>;
export type DataHandler = InstanceType<typeof DataHandler>;
export type MediaHandler = InstanceType<typeof MediaHandler>;
export type MediaSender = InstanceType<typeof MediaSender>;
export type MediaReceiver = InstanceType<typeof MediaReceiver>;
