import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { withAuth } from "../_lib/withAuth";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});

const { PROFILES_TABLE = "", USER_POOL_ID = "" } = process.env;

export const handler = withAuth(async (event: APIGatewayProxyEventV2, auth) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { name } = body as { name?: string };

    if (!name) {
      return { statusCode: 400, body: JSON.stringify({ message: "nothing_to_update" }) };
    }

    const expr: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};
    if (typeof name === "string") {
      expr.push("#name = :name");
      names["#name"] = "name";
      values[":name"] = name;
    }
    // if (typeof email === "string") {
    //   expr.push("#email = :email");
    //   names["#email"] = "email";
    //   values[":email"] = email;
    // }

    // 1) Update DynamoDB
    const out = await ddb.send(
      new UpdateCommand({
        TableName: PROFILES_TABLE,
        Key: { userId: auth.sub },
        UpdateExpression: "SET " + expr.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );

    // 2) Sync ไป Cognito (อัปเดต attribute "name")
    // หมายเหตุ: ใน pool นี้ Username = email (คุณตั้ง usernames:["email"])
    const username = (auth.raw?.["cognito:username"] as string) || auth.email!;
    let syncedToCognito = true;
    try {
      await cognito.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          UserAttributes: [{ Name: "name", Value: name }],
        })
      );
    } catch (e) {
      // ไม่ให้ล้มงานถ้า Cognito อัปเดตพลาด — แต่แจ้ง flag กลับไป
      syncedToCognito = false;
      console.error("AdminUpdateUserAttributes failed:", (e as any)?.message || e);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ...(out.Attributes ?? {}), syncedToCognito }),
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ message: "ddb_error", detail: e?.message }) };
  }
});
