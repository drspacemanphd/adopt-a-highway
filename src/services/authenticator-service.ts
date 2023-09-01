import { ICredentials } from '@aws-amplify/core';
import { Auth } from 'aws-amplify';

export class AuthenticatorService {
  private static user: any;
  private static userCredentials: ICredentials;
  private static configured: boolean = false;

  private constructor() {}

  static async getCredentials(): Promise<{ user: any, credentials: ICredentials}> {  
    try {
      if (!AuthenticatorService.configured) await AuthenticatorService.configure();

      // If not cached or expired cache, fetch
      if (
        !AuthenticatorService.userCredentials ||
        !AuthenticatorService.userCredentials.expiration ||
        AuthenticatorService.userCredentials.expiration.getTime() < Date.now()
      ) {
        AuthenticatorService.user = await Auth.currentUserInfo();
        AuthenticatorService.userCredentials = await Auth.currentUserCredentials();
      }

      return {
        user: AuthenticatorService.user,
        credentials: AuthenticatorService.userCredentials,
      };
    } catch (err) {
      AuthenticatorService.user = null;
      AuthenticatorService.userCredentials = null;
      throw err;
    }
  }

  static async signIn(username: string, password: string): Promise<any> {
    if (!AuthenticatorService.configured) AuthenticatorService.configure();
    await Auth.signIn(username, password);
    await AuthenticatorService.getCredentials();
    return AuthenticatorService.user;
  }

  static async signOut(): Promise<void> {
    if (!AuthenticatorService.configured) AuthenticatorService.configure();
    await Auth.signOut();
    AuthenticatorService.user = null;
    AuthenticatorService.userCredentials = null;
  }

  private static configure() {
    Auth.configure({
      userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID,
      userPoolWebClientId: process.env.REACT_APP_AWS_USER_POOL_WEB_CLIENT_ID,
      region: 'us-east-1',
      identityPoolId: process.env.REACT_APP_AWS_IDENTITY_POOL_ID,
      identityPoolRegion: 'us-east-1',
    });
    AuthenticatorService.configured = true;
  }
}