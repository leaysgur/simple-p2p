import { createTransport } from "../lib";

let at1;
let vt1;
// do not gUM() for each test
beforeAll(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  at1 = stream.getAudioTracks()[0];
  vt1 = stream.getVideoTracks()[0];
});
afterAll(() => {
  at1.stop();
  vt1.stop();
  at1 = vt1 = null;
});

let t1;
let t2;
let m1;
let m2;
beforeEach(async done => {
  t1 = createTransport();
  t2 = createTransport();
  t1.on("negotiation", msg => t2.handleNegotiation(msg).catch(done.fail));
  t2.on("negotiation", msg => t1.handleNegotiation(msg).catch(done.fail));
  await t1.startNegotiation().catch(done.fail);

  await Promise.all([
    new Promise(r => t1.once("open", r)),
    new Promise(r => t2.once("open", r))
  ]);
  m1 = t1.mediaHandler;
  m2 = t2.mediaHandler;
  done();
});
afterEach(() => {
  t1.close();
  t2.close();
  t1 = t2 = null;
  m1 = m2 = null;
});

describe("MediaSender#constructor()", () => {
  it("should be closed: false", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    expect(s1.closed).toBeFalsy();
    done();
  });
});

describe("MediaSender#close()", () => {
  it("should be closed: true", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.close().catch(done.fail);
    expect(s1.closed).toBeTruthy();
    done();
  });

  it("should throw after closed", async done => {
    const s1 = await m1.sendTrack(at1).catch(done.fail);
    await s1.close().catch(done.fail);
    await s1.replace(at1).catch(err => {
      expect(err).toMatch(/closed/);
      done();
    });
  });
});

describe("MediaHandler#replace()", () => {
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
