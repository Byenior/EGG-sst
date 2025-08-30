/// <reference path="./.sst/platform/config.d.ts" />

export default {
  app() {
    return {
      name: "my-sst-app",
      home: "aws",
      providers: { aws: true },
    };
  },

  async run() {
    // DynamoDB: เก็บเฉพาะ key (userId) ส่วนฟิลด์อื่นเป็น attribute ใส่ตอน Put/Update
    const profilesTable = new sst.aws.Dynamo("Profiles", {
      fields: { userId: "string" },
      primaryIndex: { hashKey: "userId" },
    });

    // Cognito User Pool + Client
    const userPool = new sst.aws.CognitoUserPool("UserPool", { usernames: ["email"] });
    const userPoolClient = userPool.addClient("UserPoolClient", {
      transform: {
        client: (args) => {
          args.explicitAuthFlows = [...(Array.isArray(args.explicitAuthFlows) ? args.explicitAuthFlows : []), "ALLOW_USER_PASSWORD_AUTH"];
        },
      },
    });

    // Public API (ไม่ต้อง auth)
    const api = new sst.aws.ApiGatewayV2("Api", {
      cors: true,
    });

    // JWT Authorizer (Cognito)
    const cognitoAuth = api.addAuthorizer({
      name: "Cognito",
      jwt: {
        issuer: $interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${userPool.id}`,
        audiences: [userPoolClient.id],
      },
    });

    const enableDevRoutes = $app.stage === "dev";

    // ======== Dev/Debug ========
    if (enableDevRoutes) {
      api.route(
        "GET /__dev__/check-jwt",
        "packages/functions/dev/devCheckJWT.handler",
        { auth: { jwt: { authorizer: cognitoAuth.id } } } // << ตำแหน่งนี้เท่านั้น
      );

      api.route("GET /debug/env", {
        handler: "packages/functions/dev/debugEnv.handler",
        environment: {
          USER_POOL_ID: userPool.id,
          USER_POOL_CLIENT_ID: userPoolClient.id,
          PROFILES_TABLE: profilesTable.name,
        },
      });

      api.route("POST /__dev__/lookup-user", {
        handler: "packages/functions/dev/devLookupUser.handler",
        environment: { USER_POOL_ID: userPool.id },
        permissions: [{ actions: ["cognito-idp:ListUsers"], resources: ["*"] }],
      });

      api.route("POST /__dev__/delete-user", {
        handler: "packages/functions/dev/devDeleteUser.handler",
        environment: { USER_POOL_ID: userPool.id },
        permissions: [{ actions: ["cognito-idp:AdminGetUser", "cognito-idp:AdminDeleteUser"], resources: ["*"] }],
      });
    }
    // ========= Auth =========
    api.route("POST /auth/signup", {
      handler: "packages/functions/auth/signup.handler",
      environment: {
        USER_POOL_ID: userPool.id,
        USER_POOL_CLIENT_ID: userPoolClient.id,
      },
    });

    api.route("POST /auth/confirm", {
      handler: "packages/functions/auth/confirm.handler",
      environment: {
        USER_POOL_ID: userPool.id,
        USER_POOL_CLIENT_ID: userPoolClient.id,
        PROFILES_TABLE: profilesTable.name,
      },
      link: [profilesTable],
      permissions: [{ actions: ["cognito-idp:ConfirmSignUp", "cognito-idp:AdminGetUser"], resources: ["*"] }],
    });

    api.route("POST /auth/login", {
      handler: "packages/functions/auth/login.handler",
      environment: {
        USER_POOL_ID: userPool.id,
        USER_POOL_CLIENT_ID: userPoolClient.id,
      },
    });
    // ----------------------------------------------------------------

    // ========= Profile (Protected) =========

    api.route(
      "GET /profile",
      {
        handler: "packages/functions/profile/getProfile.handler",
        environment: { PROFILES_TABLE: profilesTable.name },
        link: [profilesTable],
      },
      { auth: { jwt: { authorizer: cognitoAuth.id } } } // << ต้องอยู่ arg3
    );
    // api.route(
    //   "PUT /profile",
    //   {
    //     handler: "packages/functions/profile/putProfile.handler",
    //     environment: { PROFILES_TABLE: profilesTable.name },
    //     link: [profilesTable],
    //   },
    //   { auth: { jwt: { authorizer: cognitoAuth.id } } } // << ต้องอยู่ arg3
    // );
    api.route(
      "PUT /profile",
      {
        handler: "packages/functions/profile/putProfile.handler",
        environment: {
          PROFILES_TABLE: profilesTable.name,
          USER_POOL_ID: userPool.id, // << ต้องมี
        },
        link: [profilesTable],
        permissions: [
          {
            actions: ["cognito-idp:AdminUpdateUserAttributes"],
            resources: [userPool.arn], // << จำกัดแค่ pool นี้
          },
        ],
      },
      { auth: { jwt: { authorizer: cognitoAuth.id } } }
    );

    // ----------------------------------------------------------------

    // ================================================================

    return {
      ApiUrl: api.url,
      UserPoolId: userPool.id,
      UserPoolClientId: userPoolClient.id,
    };
  },
};
