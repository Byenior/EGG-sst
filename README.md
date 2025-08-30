Serverless Web App Challenge (AWS + TypeScript)
Overview

Serverless web app ด้วย AWS SST: Cognito (สมัคร/ล็อกอิน), API Gateway (JWT Authorizer), Lambda (TypeScript), DynamoDB (เก็บโปรไฟล์: userId, email, name, createdAt).

Prerequisites

Node.js v20+

AWS credentials ตั้งค่าแล้ว (aws configure หรือใช้ AWS_PROFILE)

npm

Quick Start

# Install

npm install

# Local dev (hot reload)

npx sst dev

# Deploy to AWS

npx sst deploy

# ดูค่า Outputs (เช่น ApiUrl/UserPoolClientId)

npx sst outputs

### Dev Utilities (optional)

Dev routes (`/__dev__/*`) are **disabled by default**.
Enable for demo:

```bash
ENABLE_DEV_ROUTES=true npx sst deploy


Outputs

ApiUrl — endpoint หลัก (ใช้ทั้ง public/protected)

UserPoolId, UserPoolClientId — ใช้ตรวจ JWT

ProfilesTable — ชื่อ DynamoDB table

Authentication Flow (cURL)

# Sign up

curl -X POST $ApiUrl/auth/signup \
 -H 'Content-Type: application/json' \
 -d '{"email":"me@test.com","password":"P@ssw0rd","name":"Me"}'

# Confirm sign-up (ใช้โค้ด 6 หลักที่ Cognito ส่งอีเมลมา)

curl -X POST $ApiUrl/auth/confirm \
 -H 'Content-Type: application/json' \
 -d '{"email":"me@test.com","code":"123456"}'

# Login -> get tokens

TOKENS=$(curl -s -X POST $ApiUrl/auth/login \
 -H 'Content-Type: application/json' \
 -d '{"email":"me@test.com","password":"P@ssw0rd"}')

# Extract IdToken (ใช้ตัวนี้กับ /profile)

ID_TOKEN=$(echo "$TOKENS" | node -e 'process.stdin.on("data",d=>console.log(JSON.parse(d).tokens.IdToken))')

Profile API (Protected by Cognito JWT Authorizer)

# GET /profile

curl -H "Authorization: Bearer $ID_TOKEN" $ApiUrl/profile

# PUT /profile

curl -X PUT -H 'Content-Type: application/json' \
 -H "Authorization: Bearer $ID_TOKEN" \
 -d '{"name":"New Name"}' $ApiUrl/profile

หมายเหตุ: ต้องใช้ IdToken เท่านั้น (token_use = "id"), ไม่ใช่ AccessToken

Testing
npm test

# (ถ้าเคยเปลี่ยน config เยอะ ลอง)

# npx jest --clearCache && npm test

ตัวอย่างผล (คาดหวัง):

GET /profile: 200 (มีโปรไฟล์) / 404 (ไม่มี) / 500 (DynamoDB error)

PUT /profile: 400 (ไม่มีฟิลด์อัปเดต) / 200 (สำเร็จ) / 500 (DynamoDB error)

401 (ไม่มี claims) เมื่อไม่ส่ง Authorization: Bearer <IdToken>

Architecture

Cognito User Pool — สมัคร/ยืนยัน/ล็อกอิน, ออก JWT (IdToken)

API Gateway (HTTP API v2 + JWT Authorizer) — ป้องกัน /profile ด้วย Cognito Authorizer

Lambda (Node.js 20 + TypeScript) — handlers ของ /auth/\* และ /profile

DynamoDB — ตาราง Profiles (PK: userId=sub), เก็บ email, name, createdAt (ISO timestamp)

Cleanup

# ลบทรัพยากรทั้งหมดของสแตก

npx sst remove
```
