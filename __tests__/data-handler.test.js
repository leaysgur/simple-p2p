import { createTransport } from "../lib";

let t1;
let t2;
let d1;
let d2;
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
  d1 = t1.dataHandler;
  d2 = t2.dataHandler;
  done();
});
afterEach(() => {
  t1.close();
  t2.close();
  t1 = t2 = null;
  d1 = d2 = null;
});

describe("DataHandler#constructor()", () => {
  it("should be closed: false", () => {
    expect(d1.closed).toBeFalsy();
    expect(d2.closed).toBeFalsy();
  });
});

describe("DataHandler#close()", () => {
  it("should be closed: true", () => {
    d1.close();
    expect(d1.closed).toBeTruthy();

    d2.close();
    expect(d2.closed).toBeTruthy();
  });

  it("should throw after closed", async () => {
    d1.close();
    await d1.createChannel().catch(err => {
      expect(err).toMatch(/closed/);
    });
  });
});

describe("DataHandler#createChannel()", () => {
  it("should create channel", async done => {
    d2.once("channel", c2 => {
      expect(c2 instanceof RTCDataChannel).toBeTruthy();
      done();
    });

    const c1 = await d1.createChannel().catch(done.fail);
    expect(c1 instanceof RTCDataChannel).toBeTruthy();
  });

  it("should specify label and dcInit", async done => {
    d2.once("channel", c2 => {
      expect(c2.label).toBe("hello");
      expect(c2.ordered).toBeFalsy();
      done();
    });

    const c1 = await d1
      .createChannel("hello", { ordered: false })
      .catch(done.fail);
    expect(c1.label).toBe("hello");
    expect(c1.ordered).toBeFalsy();
  });
});
