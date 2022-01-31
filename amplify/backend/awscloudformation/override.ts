import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyRootStackTemplate) {
    resources.authRole.roleName = 'amplify-adoptahighway-dev-53135-authRole'
}
