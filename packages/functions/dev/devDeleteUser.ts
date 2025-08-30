import { CognitoIdentityProviderClient, AdminDeleteUserCommand, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});
const { USER_POOL_ID = "" } = process.env;

export const handler = async (event: any) => {
  const body = JSON.parse(event.body || "{}");
  const { email } = body as { email?: string };
  if (!email) return { statusCode: 400, body: JSON.stringify({ message: "email required" }) };
  await client.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email }));
  await client.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email }));
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
