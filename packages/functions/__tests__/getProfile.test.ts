import { afterEach, beforeAll, describe, expect, jest, test } from "@jest/globals";

// mock withAuth -> ยัด sub/email คงที่
jest.mock("../_lib/withAuth", () => ({
  withAuth: (fn: any) => (event: any) =>
    fn(event, {
      sub: "896aa5ec-c0a1-70ef-d675-0716c23774f5",
      email: "nathaphong.won@gmail.com",
    }),
}));

// ---- MOCK DDB (สำคัญ) ----
const sendMock: jest.Mock<any> = jest.fn();
jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocumentClient: { from: jest.fn(() => ({ send: sendMock })) },
    UpdateCommand: class {
      constructor(public input: any) {}
    },
  };
});

// โหลด handler หลัง mock เสร็จ และตั้ง env ก่อน
let handler: any;
beforeAll(async () => {
  process.env.PROFILES_TABLE = "Profiles";
  ({ handler } = await import("../profile/putProfile"));
});

afterEach(async () => sendMock.mockReset());

describe("PUT /profile", () => {
  test("400 no fields", async () => {
    const res = await handler({ body: JSON.stringify({}) } as any);
    expect(res.statusCode).toBe(400);
  });

  test("200 updated", async () => {
    sendMock.mockResolvedValueOnce({
      Attributes: { userId: "896aa5ec-c0a1-70ef-d675-0716c23774f5", name: "Neo" },
    });
    const res = await handler({ body: JSON.stringify({ name: "Neo" }) } as any);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).name).toBe("Neo");
  });

  test("ddb error -> 500", async () => {
    sendMock.mockRejectedValueOnce(new Error("boom"));
    const res = await handler({ body: JSON.stringify({ name: "Neo" }) } as any);
    expect(res.statusCode).toBe(500);
  });
});
