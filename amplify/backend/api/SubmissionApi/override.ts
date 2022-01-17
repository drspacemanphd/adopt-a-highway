// This file is used to override the REST API resources configuration
import { AmplifyApiRestResourceStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyApiRestResourceStackTemplate) {
  resources.addCfnParameter({ type: 'String' }, 'authadoptahighwayef719878UserPoolId');

  resources.restApi.body.securityDefinitions = {
    UserPool: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      'x-amazon-apigateway-authtype': 'cognito_user_pools',
      'x-amazon-apigateway-authorizer': {
        type: 'cognito_user_pools',
        'providerARNs': [
          {
            // eslint throws warning for "unexpected substitutions" in non-template string
            // eslint-disable-next-line
            'Fn::Sub': 'arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${authadoptahighwayef719878UserPoolId}'
          }
        ]
      }
    }
  };

  resources.restApi.body.paths['/']['x-amazon-apigateway-any-method'].security = [
    {
      UserPool: []
    }
  ];

  resources.restApi.body.paths['//{proxy+}']['x-amazon-apigateway-any-method'].security = [
    {
      UserPool: []
    }
  ];
}
