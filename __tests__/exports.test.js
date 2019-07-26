import { createTransport } from "../lib";

describe("exports", () => {
  it("should not throw w/o arguments", () => {
    expect(() => createTransport()).not.toThrowError();
    expect(() => createTransport({})).not.toThrowError();
  });

  it("should accept RTCConfiguration", () => {
    const t = createTransport({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    const config = t._pc.getConfiguration();
    expect(config.iceServers.length).toBe(1);
    expect(config.bundlePolicy).toBe("max-bundle");
  });

  it("should not accept some keys for RTCConfiguration", () => {
    const t = createTransport({
      bundlePolicy: "max-compat"
    });
    const config = t._pc.getConfiguration();
    expect(config.bundlePolicy).toBe("max-bundle");
  });
});
