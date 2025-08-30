import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { withAuth } from "../_lib/withAuth";

const { PROFILES_TABLE = "" } = process.env;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = withAuth(async (_event: APIGatewayProxyEventV2, auth) => {
  try {
    const out = await ddb.send(new GetCommand({ TableName: PROFILES_TABLE, Key: { userId: auth.sub } }));
    if (!out.Item) {
      return { statusCode: 404, body: JSON.stringify({ message: "profile_not_found" }) };
    }
    return { statusCode: 200, body: JSON.stringify(out.Item) };
  } catch (err: any) {
    // map DynamoDB error -> 500 ตามที่เทสต้องการ
    return { statusCode: 500, body: JSON.stringify({ message: "ddb_error", error: err?.name || "Unknown" }) };
  }
});
