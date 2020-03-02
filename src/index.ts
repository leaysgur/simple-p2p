import _debug from "debug";
import _Transport from "./transport";
import _DataHandler from "./data-handler";
import _MediaHandler from "./media-handler";
import _MediaSender from "./media-sender";
import _MediaReceiver from "./media-receiver";

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

  return new _Transport(pc);
}

export type Transport = InstanceType<typeof _Transport>;
export type DataHandler = InstanceType<typeof _DataHandler>;
export type MediaHandler = InstanceType<typeof _MediaHandler>;
export type MediaSender = InstanceType<typeof _MediaSender>;
export type MediaReceiver = InstanceType<typeof _MediaReceiver>;
