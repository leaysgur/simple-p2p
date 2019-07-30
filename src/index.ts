import _debug from "debug";
import Transport from "./transport";
import MediaHandler from "./media-handler";
import DataHandler from "./data-handler";
import MediaSender from "./media-sender";

const debug = _debug("simple-p2p");

export function createTransport(configuration: RTCConfiguration = {}) {
  Object.assign(configuration, {
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require"
  });
  debug("create RTCPeerConnection w/", configuration);
  const pc = new RTCPeerConnection(configuration);

  return new Transport(pc);
}

export type Transport = InstanceType<typeof Transport>;
export type MediaHandler = InstanceType<typeof MediaHandler>;
export type DataHandler = InstanceType<typeof DataHandler>;
export type MediaSender = InstanceType<typeof MediaSender>;
