import type { APIGatewayProxyEventV2 } from "aws-lambda";

export type JwtAuth = {
  sub: string;
  email?: string;
  raw?: any;
};

export function getJwtAuth(event: APIGatewayProxyEventV2): JwtAuth | null {
  const rc: any = (event as any).requestContext;
  console.log("event : ", event);
  // HTTP API v2 (JWT authorizer)
  const claimsV2 = rc?.authorizer?.jwt?.claims;
  // REST API v1 (Cognito user pool authorizer)
  const claimsV1 = rc?.authorizer?.claims;

  const claims = claimsV2 ?? claimsV1;
  if (!claims?.sub) return null;

  const sub = String(claims.sub);
  const email = (claims.email as string) || (claims["cognito:username"] as string) || undefined;

  return { sub, email, raw: claims };
}

export const withAuth =
  <T extends (event: APIGatewayProxyEventV2, auth: JwtAuth) => Promise<any>>(fn: T) =>
  async (event: APIGatewayProxyEventV2) => {
    const auth = getJwtAuth(event);
    if (!auth?.sub) {
      return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
    }
    return fn(event, auth);
  };
