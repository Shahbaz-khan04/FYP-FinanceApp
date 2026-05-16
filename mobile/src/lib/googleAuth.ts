import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { env } from '../config/env';

WebBrowser.maybeCompleteAuthSession();

export const googleAuth = {
  isConfigured() {
    return env.googleWebClientId.trim().length > 0;
  },

  useGoogleIdTokenRequest() {
    const [request, _response, promptAsync] = Google.useIdTokenAuthRequest({
      webClientId: env.googleWebClientId || 'missing-google-web-client-id',
      iosClientId: env.googleIosClientId || undefined,
      androidClientId: env.googleAndroidClientId || undefined,
      scopes: ['openid', 'profile', 'email'],
    });
    return { request, promptAsync };
  },
};
