import { connectTransports, getUserMedia } from "./helper";
import { createTransport } from "../lib";

let at1;
let vt1;
// do not gUM() for each test
beforeAll(async done => {
  const { vt, at } = await getUserMedia(done);
  at1 = at;
  vt1 = vt;
  done();
});
afterAll(() => {
  at1 = vt1 = null;
});

let t1;
let t2;
let m1;
beforeEach(async done => {
  t1 = createTransport();
  t2 = createTransport();
  await connectTransports(t1, t2, done);

  m1 = t1.mediaHandler;
  done();
});
afterEach(() => {
  t1.close();
  t2.close();
  t1 = t2 = null;
  m1 = null;
});

describe("MediaSender#constructor()", () => {
  it("should be ended: false", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    expect(s1.ended).toBeFalsy();
    done();
  });
});

describe("MediaSender#end()", () => {
  it("should be ended: true", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.end().catch(done.fail);
    expect(s1.ended).toBeTruthy();
    done();
  });

  it("should throw after ended", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.end().catch(done.fail);
    await s1.replace(at1).catch(err => {
      expect(err).toMatch(/ended/);
      done();
    });
  });
});

describe("MediaSender#replace()", () => {
  it("should replace track", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.replace(at1.clone()).catch(done.fail);
    done();
  });

  it("should throw when MST not passed", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.replace(null).catch(err => {
      expect(err).toMatch(/MediaStreamTrack/);
      done();
    });
  });

  it("should throw when replace the same track", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.replace(at1).catch(err => {
      expect(err).toMatch(/same/);
      done();
    });
  });

  it("should throw when replace a different kind of track", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.replace(vt1).catch(err => {
      expect(err).toMatch(/kind/);
    });
    done();
  });
});

describe("MediaSender#getStats()", () => {
  it("should get sender stats", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    const stats = await s1.getStats().catch(done.fail);
    expect(stats instanceof RTCStatsReport).toBeTruthy();
    done();
  });
});

describe("MediaSender#getParameters()", () => {
  it("should get params", async done => {
    const s1 = await m1.sendTrack(vt1).catch(done.fail);
    const params = await s1.getParameters().catch(done.fail);
    // Firefox ~70 returns empty object
    expect(params).toBeTruthy();
    done();
  });
});

describe("MediaSender#updateParameters()", () => {
  it("should update params", async done => {
    const s1 = await m1.sendTrack(vt1).catch(done.fail);

    await s1
      .updateParameters(params => {
        if (params.encodings && params.encodings[0]) {
          // for Chrome, Safari: need to update props
          params.encodings[0].maxBitrate = 10000;
        } else {
          // for Firefox: can assign directly
          params.encodings = [{ maxBitrate: 10000 }];
        }
        return params;
      })
      .catch(done.fail);

    const updated = await s1.getParameters().catch(done.fail);
    expect(updated.encodings[0].maxBitrate).toBe(10000);
    done();
  });
});
