import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { getJwtAuth } from "../_lib/withAuth";

export const handler = async (event: APIGatewayProxyEventV2) => {
  const auth = getJwtAuth(event);
  return { statusCode: 200, body: JSON.stringify({ auth }) };
};
