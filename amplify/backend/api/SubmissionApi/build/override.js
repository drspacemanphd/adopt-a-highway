"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.override = void 0;
function override(resources) {
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
exports.override = override;
