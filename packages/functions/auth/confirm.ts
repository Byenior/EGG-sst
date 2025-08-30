import { CognitoIdentityProviderClient, ConfirmSignUpCommand, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

const cognito = new CognitoIdentityProviderClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const { USER_POOL_ID = "", USER_POOL_CLIENT_ID = "", PROFILES_TABLE = "" } = process.env;

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, code } = body as { email: string; code: string };
    if (!email || !code) return { statusCode: 400, body: JSON.stringify({ message: "email & code required" }) };

    // ยืนยัน sign up
    await cognito.send(new ConfirmSignUpCommand({ ClientId: USER_POOL_CLIENT_ID, Username: email, ConfirmationCode: code }));

    // ดึง sub เพื่อไปสร้าง profile เริ่มต้น
    const user = await cognito.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email }));
    const subAttr = user.UserAttributes?.find((a) => a.Name === "sub");
    const nameAttr = user.UserAttributes?.find((a) => a.Name === "name");
    const sub = subAttr?.Value!;

    const now = new Date().toISOString();
    await ddb.send(
      new PutCommand({
        TableName: PROFILES_TABLE,
        Item: {
          userId: sub,
          email,
          name: nameAttr?.Value || email.split("@")[0],
          createdAt: now,
        },
        ConditionExpression: "attribute_not_exists(userId)",
      })
    );

    return { statusCode: 200, body: JSON.stringify({ ok: true, userId: sub }) };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message || "confirm_failed" }) };
  }
};
