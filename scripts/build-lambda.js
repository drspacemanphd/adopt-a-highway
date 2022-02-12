const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const buildLambda = async (functionName) => {
  try {
    // Clean existing src
    await execAsync(`(cd amplify/backend/function/${functionName}/ && rm -rf src && mkdir src)`);

    // Build JS src from TS lib
    await execAsync(`(cd amplify/backend/function/${functionName}/ && tsc -p tsconfig.json)`);
    
    // Copy package.json and lockfile
    await execAsync(`(cd amplify/backend/function/${functionName}/ && cp ./lib/*.json ./src && cp ./lib/yarn.lock ./src)`);

    // Copy install production dependencies
    await execAsync(`(cd amplify/backend/function/${functionName}/src && yarn --cwd=./ --production --frozen-lockfile install)`);

    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

buildLambda(process.argv[2]);