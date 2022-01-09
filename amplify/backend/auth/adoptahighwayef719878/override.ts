import { AmplifyAuthCognitoStackTemplate } from "@aws-amplify/cli-extensibility-helper";

export function override(resources: AmplifyAuthCognitoStackTemplate) {
  resources.userPool.accountRecoverySetting = {
    recoveryMechanisms: [
      {
        name: "verified_email",
        priority: 1,
      },
    ],
  };

  resources.userPool.adminCreateUserConfig = {
    allowAdminCreateUserOnly: true,
    inviteMessageTemplate: {
      emailMessage:
        "Hi There! Thanks for helping keep Delaware clean! Your username is {username} and your temporary password is {####}",
      emailSubject: "Thanks for trying out Adopt-A-Highway!",
    },
  };

  resources.userPool.emailConfiguration = {
    emailSendingAccount: "COGNITO_DEFAULT",
  };

  resources.userPool.emailVerificationMessage =
    "Hi There! Thanks for helping keep Delaware clean! Your verification code is {####}";

  resources.userPool.userPoolName = {
    "Fn::If": [
      "ShouldNotCreateEnvResources",
      "adoptahighway-userpool",
      {
        "Fn::Join": [
          "-",
          [
            "adoptahighway",
            "userpool",
            {
              "Ref": "env"
            }
          ]
        ]
      }
    ]
  } as unknown as any;

  resources.userPool.policies = {
    passwordPolicy: {
      minimumLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: true,
    },
  };

  // A hack to directly inject cloudformation template via typescript
  resources.userPoolClient.clientName = {
    "Fn::Join": [
      "-",
      [
        "adoptahighway",
        "userpoolclient",
        {
          Ref: "env",
        },
      ],
    ],
  } as unknown as any;

  // A hack to directly inject cloudformation template via typescript
  resources.userPoolClientWeb.clientName = {
    "Fn::Join": [
      "-",
      [
        "adoptahighway",
        "userpoolwebclient",
        {
          Ref: "env",
        },
      ],
    ],
  } as unknown as any;

  resources.userPoolClientLambdaPolicy.policyName = {
    "Fn::Join": [
      "-",
      [
        "adoptahighway",
        "userpoolclientlambda",
        "describeclientpolicy",
        {
          "Ref": "env"
        }
      ]
    ]
  } as unknown as any;

  resources.userPoolClientLogPolicy.policyName = {
    "Fn::Join": [
      "-",
      [
        "adoptahighway",
        "userpoolclientlambda",
        "logpolicy",
        {
          "Ref": "env"
        }
      ]
    ]
  } as unknown as any;

  resources.identityPool.identityPoolName = {
    "Fn::Join": [
      "-",
      [
        "adoptahighway",
        "identitypool",
        {
          Ref: "env",
        },
      ],
    ],
  } as unknown as any;
}
