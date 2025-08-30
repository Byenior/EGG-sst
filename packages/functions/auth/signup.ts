import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

const client = new CognitoIdentityProviderClient({});
const { USER_POOL_CLIENT_ID = "" } = process.env;

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password, name } = body as { email: string; password: string; name?: string };
    if (!email || !password) return { statusCode: 400, body: JSON.stringify({ message: "email & password required" }) };

    const cmd = new SignUpCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }, ...(name ? [{ Name: "name", Value: name }] : [])],
    });
    try {
      await client.send(cmd);
    } catch (err: any) {
      return { statusCode: 500, body: JSON.stringify({ message: err.message || "signup_failed" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "PENDING_CONFIRMATION",
        message: `สมัครสำเร็จ กรุณายืนยันตัวตนด้วยโค้ดที่ส่งไปยัง ${email}`,
      }),
    };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "signup_failed" }) };
  }
};
