// import { jwtVerify, createRemoteJWKSet } from "jose";

// const REGION = process.env.AWS_REGION || "ap-southeast-1";
// const USER_POOL_ID = process.env.USER_POOL_ID!; // ต้องส่งให้ Lambda เป็น env
// const CLIENT_ID = process.env.USER_POOL_CLIENT_ID!; // ต้องส่งให้ Lambda เป็น env

// const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
// const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

// export async function verifyBearerIdToken(authHeader?: string) {
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     throw new Error("No Bearer token");
//   }
//   const token = authHeader.slice(7);

//   // ตรวจลายเซ็น + iss + aud + exp ครบ
//   const { payload } = await jwtVerify(token, JWKS, {
//     issuer: ISSUER,
//     audience: CLIENT_ID,
//   });

//   if (payload.token_use !== "id") {
//     throw new Error(`Unexpected token_use: ${payload.token_use}`);
//   }
//   return { token, payload };
// }

// packages/functions/_lib/verifyCognitoJwt.ts
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

const REGION = process.env.AWS_REGION ?? "ap-southeast-1";
const USER_POOL_ID = process.env.USER_POOL_ID!; // ต้องส่งให้ Lambda เป็น env
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID!; // ต้องส่งให้ Lambda เป็น env

const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

export type IdPayload = JWTPayload & {
  sub: string;
  token_use?: string;
  email?: string;
  name?: string;
  "cognito:username"?: string;
};

function getBearer(header?: string) {
  if (!header) throw new Error("Missing Authorization header");
  const m = header.trim().match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error("No Bearer token");
  return m[1];
}

export async function verifyBearerIdToken(authHeader?: string) {
  const token = getBearer(authHeader);
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: CLIENT_ID, // Cognito ID token: aud = client id
    clockTolerance: 60, // กัน clock skew (วินาที)
  });
  if (payload.token_use !== "id") {
    throw new Error(`Unexpected token_use: ${payload.token_use}`);
  }
  return { token, payload: payload as IdPayload };
}

// import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

// const REGION = process.env.AWS_REGION ?? "ap-southeast-1";
// const USER_POOL_ID = process.env.USER_POOL_ID!; // ต้องส่งเข้า Lambda เป็น env
// const CLIENT_ID = process.env.USER_POOL_CLIENT_ID!; // ต้องส่งเข้า Lambda เป็น env

// const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
// const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

// export type VerifiedPayload = JWTPayload & {
//   sub: string;
//   token_use?: string;
//   email?: string;
//   name?: string;
//   "cognito:username"?: string;
// };

// function extractBearer(authHeader?: string): string {
//   if (!authHeader) throw new Error("Missing Authorization header");
//   const m = authHeader.match(/^Bearer\\s+(.+)$/i);
//   if (!m) throw new Error("No Bearer token");
//   return m[1];
// }

// /** ตรวจลายเซ็น + iss + aud + exp และบังคับว่าเป็น ID token เท่านั้น */
// export async function verifyBearerIdToken(authHeader?: string) {
//   const token = extractBearer(authHeader);
//   const { payload } = await jwtVerify(token, JWKS, {
//     issuer: ISSUER,
//     audience: CLIENT_ID,
//   });
//   if (payload.token_use !== "id") {
//     throw new Error(`Unexpected token_use: ${payload.token_use}`);
//   }
//   return { token, payload: payload as VerifiedPayload };
// }
