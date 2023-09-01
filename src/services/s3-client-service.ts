import { S3Client } from "@aws-sdk/client-s3";
import { AuthenticatorService } from "./authenticator-service";

export class S3ClientService {
  private static s3Client: S3Client;
  private static configured: boolean;

  static async getClient() {
    if (!S3ClientService.configured) {
      await S3ClientService.configure();
    }
    return S3ClientService.s3Client;
  }

  // It appears that the credentials provided to the S3Client are not automatically
  // refreshed upon expiry. This makes sense as the client has no understanding of
  // where the credentials come from or of their possible refresh mechanism
  // This method uses the AuthenticatorService to repeatedly refresh identity credentials
  // from CongitoUser keys when the identity credentials are near expiry.
  private static async configure() {
    const { credentials } = await AuthenticatorService.getCredentials();
    S3ClientService.s3Client = new S3Client({ region: 'us-east-1', credentials });

    // If no expiration assume 1 hr, should not happen in practice
    const expiration = credentials.expiration || new Date(Date.now() + (1000 * 60 * 60));
    
    // Give 10 second buffer to refresh the credentials (and client) before cred expiry
    const whenToRefresh = expiration.getTime() - Date.now() < 10000
        ? expiration.getTime() - Date.now()
        : expiration.getTime() - Date.now() - 10000;

    setTimeout(async () => {
      await S3ClientService.configure();
    }, whenToRefresh);

    S3ClientService.configured = true;
  }
}
