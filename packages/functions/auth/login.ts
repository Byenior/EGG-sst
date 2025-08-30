import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

const client = new CognitoIdentityProviderClient({});
const { USER_POOL_CLIENT_ID = "" } = process.env;

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body as { email: string; password: string };
    if (!email || !password) return { statusCode: 400, body: JSON.stringify({ message: "email & password required" }) };

    const out = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: USER_POOL_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      })
    );

    return { statusCode: 200, body: JSON.stringify({ tokens: out.AuthenticationResult }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "login_failed" }) };
  }
};
