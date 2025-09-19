export interface DocuSignConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  authBaseUrl: string;
  navigatorBaseUrl: string;
  clmBaseUrl: string;
  accountId?: string; // Optional - can be retrieved after authentication
}

export interface TokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  obtained_at: number;
}

export interface AuthorizationUrlParams {
  response_type: 'code';
  scope: string;
  client_id: string;
  redirect_uri: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256';
}

export interface TokenExchangeParams {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string;
  redirect_uri?: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  code_verifier?: string;
}