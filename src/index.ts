import _debug from "debug";
import Transport from "./transport";

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
