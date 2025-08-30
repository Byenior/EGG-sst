import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});
const { USER_POOL_ID = "" } = process.env;

export const handler = async () => {
  const out = await client.send(new ListUsersCommand({ UserPoolId: USER_POOL_ID, Limit: 10 }));
  return { statusCode: 200, body: JSON.stringify({ count: out.Users?.length ?? 0, users: out.Users }) };
};
