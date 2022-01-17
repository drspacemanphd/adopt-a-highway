import * as awslambda from 'aws-lambda';

export const handler = async (event: awslambda.APIGatewayProxyEvent) => {
  return {
    statusCode: 200,
    headers: {
      // Although API Gateway pre-flight req returns the correct headers
      // The output of the lambda must have below headers
      // These are returned by the gateway; otherwise browser throws CORS error 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    },
    body: JSON.stringify({
      test: 'TESTING'
    })
  }
}