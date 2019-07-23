import _debug from "debug";
import Transport from "./transport";
import Peer from "./peer";
import Sender from "./sender";

const debug = _debug("simple-p2p");

export function createTransport(configuration: RTCConfiguration = {}) {
  Object.assign(configuration, {
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require"
  });
  debug("create PeerConnection w/", configuration);
  const pc = new RTCPeerConnection(configuration);

  // TODO: collect capabilities w/ another pc
  return new Transport(pc);
}

export type Transport = InstanceType<typeof Transport>;
export type Peer = InstanceType<typeof Peer>;
export type Sender = InstanceType<typeof Sender>;
