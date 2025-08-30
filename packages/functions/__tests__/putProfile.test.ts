import { afterEach, beforeAll, describe, expect, jest, test } from "@jest/globals";

jest.mock("../_lib/withAuth", () => ({
  withAuth: (fn: any) => (event: any) =>
    fn(event, {
      sub: "896aa5ec-c0a1-70ef-d675-0716c23774f5",
      email: "nathaphong.won@gmail.com",
    }),
}));

// ---- MOCK DDB ----
const sendMock: jest.Mock<any> = jest.fn();
jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: sendMock })) },
    GetCommand: class {
      constructor(public input: any) {}
    },
  };
});
// -------------------------

// โหลด handler หลัง mock เสร็จ และตั้ง env ก่อน
let handler: any;
beforeAll(async () => {
  process.env.PROFILES_TABLE = "Profiles";
  ({ handler } = await import("../profile/getProfile"));
});

afterEach(async () => sendMock.mockReset());

describe("GET /profile", () => {
  test("200 ok", async () => {
    sendMock.mockResolvedValueOnce({
      Item: { userId: "896aa5ec-c0a1-70ef-d675-0716c23774f5", name: "A" },
    });
    const res = await handler({} as any);
    expect(res.statusCode).toBe(200);
  });

  test("404 not found", async () => {
    sendMock.mockResolvedValueOnce({});
    const res = await handler({} as any);
    expect(res.statusCode).toBe(404);
  });

  test("ddb error -> 500", async () => {
    sendMock.mockRejectedValueOnce(new Error("boom"));
    const res = await handler({} as any);
    expect(res.statusCode).toBe(500);
  });
});
