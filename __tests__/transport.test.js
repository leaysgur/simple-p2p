import { parse } from "sdp-transform";
import { createTransport } from "../lib";

let t1;
let t2;
beforeEach(() => {
  t1 = createTransport();
  t2 = createTransport();
});
afterEach(() => {
  t1.close();
  t2.close();
  t1 = t2 = null;
});

describe("Transport#close()", () => {
  it("should close", () => {
    expect(t1.closed).toBeFalsy();
    expect(t1.connectionState).toBe("new");

    t1.close();
    expect(t1.closed).toBeTruthy();
    expect(t1.connectionState).toBe("closed");
  });

  it("should throw after closed", async () => {
    t1.close();
    await t1.startNegotiation().catch(err => {
      expect(err).toMatch(/closed/);
    });
  });
});

describe("Transport#startNegotiation()", () => {
  it("should emit negotiation event(offer)", done => {
    t1.once("negotiation", msg => {
      expect(msg.type).toBe("offer");
      expect(msg.data.type).toBe("offer");
      const { groups, media } = parse(msg.data.sdp);

      // ensure only bundled datachannel exists
      expect(groups.length).toBe(1);
      expect(groups[0].type).toBe("BUNDLE");

      expect(media.length).toBe(1);
      expect(media[0].type).toBe("application");
      expect(media[0].mid).toBe(0);

      done();
    });
    t1.startNegotiation();
  });
});

describe("Transport#handleNegotiation()", () => {
  it("should emit negotiation event(answer)", done => {
    t2.once("negotiation", msg => {
      expect(msg.type).toBe("answer");
      expect(msg.data.type).toBe("answer");
      const { groups, media } = parse(msg.data.sdp);

      // ensure only bundled datachannel exists
      expect(groups.length).toBe(1);
      expect(groups[0].type).toBe("BUNDLE");

      expect(media.length).toBe(1);
      expect(media[0].type).toBe("application");
      expect(media[0].mid).toBe(0);
      done();
    });

    t1.once("negotiation", async msg => {
      await t2.handleNegotiation(msg).catch(done.fail);
    });
    t1.startNegotiation();
  });

  it("should emit negotiation event(candidate)", done => {
    t2.on("negotiation", async msg => {
      if (msg.type === "candidate") done();
    });

    t1.on("negotiation", async msg => {
      await t2.handleNegotiation(msg).catch(done.fail);
    });
    t1.startNegotiation();
  });
});

describe("Transport#events", () => {
  it("should emit open event", async done => {
    t1.on("negotiation", msg => t2.handleNegotiation(msg).catch(done.fail));
    t2.on("negotiation", msg => t1.handleNegotiation(msg).catch(done.fail));
    await t1.startNegotiation().catch(done.fail);

    await Promise.all([
      new Promise(r => t1.once("open", r)),
      new Promise(r => t2.once("open", r))
    ]);
    done();
  });

  it("should emit connectionStateChange event", async done => {
    const states = [];
    t1.on("connectionStateChange", state => {
      states.push(state);

      if (state === "connecting") {
        expect(states.length).toBe(1);
        expect(states[0]).toBe("connecting");
      }
      if (state === "connected") {
        expect(states.length).toBe(2);
        expect(states[1]).toBe("connected");
        t1.close();
      }
      if (state === "closed") {
        expect(states.length).toBe(3);
        expect(states[2]).toBe("closed");
        done();
      }
    });

    t1.on("negotiation", msg => t2.handleNegotiation(msg).catch(done.fail));
    t2.on("negotiation", msg => t1.handleNegotiation(msg).catch(done.fail));
    await t1.startNegotiation().catch(done.fail);
  });

  it("should emit close event", done => {
    t1.once("close", done);
    t1.close();
  });
});

describe("Transport#restartIce()", () => {
  it("should update ice entries", async done => {
    let iceEntries = null;
    t1.on("negotiation", async msg => {
      if (msg.type === "offer") {
        const {
          media: [{ iceUfrag, icePwd }]
        } = parse(msg.data.sdp);

        iceEntries = { iceUfrag, icePwd };
      }
      await t2.handleNegotiation(msg).catch(done.fail);
    });
    t2.on("negotiation", msg => t1.handleNegotiation(msg).catch(done.fail));
    await t1.startNegotiation().catch(done.fail);

    await Promise.all([
      new Promise(r => t1.once("open", r)),
      new Promise(r => t2.once("open", r))
    ]);

    t1.removeAllListeners("negotiation");
    t1.on("negotiation", msg => {
      const {
        media: [{ iceUfrag, icePwd }]
      } = parse(msg.data.sdp);

      expect(iceUfrag).not.toBe(iceEntries.iceUfrag);
      expect(icePwd).not.toBe(iceEntries.icePwd);
      done();
    });

    await t1.restartIce();
  });

  it("should not update ice entries in ordinary case", async done => {
    let iceEntries = null;
    t1.on("negotiation", async msg => {
      const {
        media: [{ iceUfrag, icePwd }]
      } = parse(msg.data.sdp);

      if (iceEntries === null) {
        iceEntries = { iceUfrag, icePwd };
      } else {
        expect(iceUfrag).toBe(iceEntries.iceUfrag);
        expect(icePwd).toBe(iceEntries.icePwd);
        done();
      }
    });

    await t1.startNegotiation().catch(done.fail);

    // createOffer() again w/ do nothing
    await t1.startNegotiation().catch(done.fail);
  });
});

describe("Transport#getStats()", () => {
  it("should get transport stats", async () => {
    const stats = await t1.getStats();
    expect(stats instanceof RTCStatsReport).toBeTruthy();
  });
});

describe("Transport#updateIceServers()", () => {
  it("should update", done => {
    const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

    try {
      t1.updateIceServers(iceServers);
      t1.updateIceServers([]);
      done();
    } catch (err) {
      if (/firefox/i.test(navigator.userAgent)) {
        expect(err).toMatch("not support");
        done();
      } else {
        done.fail("should not throw");
      }
    }
  });

  it("should throw if transport closed", () => {
    t1.close();
    expect(() => t1.updateIceServers([])).toThrowError(/closed/);
  });
});
