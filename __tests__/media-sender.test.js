import { connectTransports } from "./helper";
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
