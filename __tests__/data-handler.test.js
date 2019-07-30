import { connectTransports } from "./helper";
import { createTransport } from "../lib";

let t1;
let t2;
let d1;
let d2;
beforeEach(async done => {
  t1 = createTransport();
  t2 = createTransport();
  await connectTransports(t1, t2, done);

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

describe("DataHandler#closed", () => {
  it("should be closed: true", () => {
    t1.close();
    expect(d1.closed).toBeTruthy();

    t2.close();
    expect(d2.closed).toBeTruthy();
  });

  it("should throw after closed", async () => {
    t1.close();
    await d1.createChannel().catch(err => {
      expect(err).toMatch(/closed/);
    });
  });
});

describe("DataHandler#createChannel()", () => {
  it("should create channel", async done => {
    const channels = [];
    d2.on("channel", c2 => {
      expect(c2 instanceof RTCDataChannel).toBeTruthy();
      channels.push(c2);
    });

    const c1 = await d1.createChannel().catch(done.fail);
    expect(c1 instanceof RTCDataChannel).toBeTruthy();
    expect(channels.length).toBe(1);
    done();
  });

  it("should specify label and dcInit", async done => {
    const channels = [];
    d2.on("channel", c2 => {
      expect(c2.label).toBe("hello");
      expect(c2.ordered).toBeFalsy();
      channels.push(c2);
    });

    const c1 = await d1
      .createChannel("hello", { ordered: false })
      .catch(done.fail);
    expect(c1.label).toBe("hello");
    expect(c1.ordered).toBeFalsy();
    expect(channels.length).toBe(1);
    done();
  });
});
