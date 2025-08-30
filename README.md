# How to deploy the app

npm install

# ดีพลอยขึ้น AWS (SST)

npx sst deploy

# ดูค่า Outputs (เช่น ApiUrl, UserPoolClientId)

npx sst outputs

# How to test the app

npm test

# กรณีเคยเปลี่ยน config เยอะ

npx jest --clearCache && npm test

# Architecture overview

Cognito User Pool — สมัคร/ยืนยัน/ล็อกอิน, ออก JWT (IdToken)

API Gateway (HTTP API v2 + JWT Authorizer) — ป้องกัน GET/PUT /profile ด้วย Cognito Authorizer (ต้องส่ง Authorization: Bearer <IdToken>)

Lambda (Node.js 20 + TypeScript) — handlers ของ /auth/\* และ /profile

DynamoDB — ตาราง Profiles (PK: userId = sub) เก็บ email, name, createdAt (ISO 8601)

# Sample unit test results

PASS packages/functions/**tests**/getProfile.test.ts
✓ 200 ok (xx ms)
✓ 404 not found (xx ms)
✓ ddb error -> 500 (xx ms)

PASS packages/functions/**tests**/putProfile.test.ts
✓ 400 no fields (xx ms)
✓ 200 updated (xx ms)
✓ ddb error -> 500 (xx ms)

Test Suites: 2 passed, 2 total
Tests: 6 passed, 6 total
Snapshots: 0 total
Time: 10.1 s
Ran all test suites.
