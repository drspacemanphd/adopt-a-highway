/**
 * This is a sample hook script created by Amplify CLI.
 * To start using this pre-push hook please change the filename:
 * pre-push.js.sample  ->  pre-push.js
 *
 * learn more: https://docs.amplify.aws/cli/usage/command-hooks
 */

/**
 * @param data { { amplify: { environment: string, command: string, subCommand: string, argv: string[] } } }
 * @param error { { message: string, stack: string } }
 */
 const hookHandler = async (data, error) => {
  const fs = require("fs");

  const content = `
import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyRootStackTemplate) {
  resources.authRole.roleName = 'amplify-adoptahighway-${data.amplify.environment.envName}-authRole';
  resources.unauthRole.roleName = 'amplify-adoptahighway-${data.amplify.environment.envName}-unauthRole';
}
`;

  fs.writeFileSync(`amplify/backend/awscloudformation/override.ts`, content);
  process.exit(0);
};

const getParameters = async () => {
  const fs = require("fs");
  return JSON.parse(fs.readFileSync(0, { encoding: "utf8" }));
};

getParameters()
  .then((event) => hookHandler(event.data, event.error))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
