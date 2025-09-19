import { TokenData } from '../types/auth';

export class TokenManager {
  private tokenData: TokenData | null = null;
  private readonly tokenExpiryBuffer = 300; // 5 minutes buffer before expiry

  constructor() {}

  setTokenData(tokenData: TokenData): void {
    this.tokenData = {
      ...tokenData,
      obtained_at: Date.now()
    };
  }

  getTokenData(): TokenData | null {
    return this.tokenData;
  }

  getAccessToken(): string | null {
    if (!this.tokenData) {
      return null;
    }

    if (this.isTokenExpired()) {
      return null;
    }

    return this.tokenData.access_token;
  }

  getRefreshToken(): string | null {
    return this.tokenData?.refresh_token || null;
  }

  isTokenExpired(): boolean {
    if (!this.tokenData) {
      return true;
    }

    const now = Date.now();
    const expiresAt = this.tokenData.obtained_at + (this.tokenData.expires_in * 1000);

    // Use buffer to refresh before actual expiry
    return now >= (expiresAt - (this.tokenExpiryBuffer * 1000));
  }

  needsRefresh(): boolean {
    return this.isTokenExpired() && !!this.tokenData?.refresh_token;
  }

  clearTokenData(): void {
    this.tokenData = null;
  }

  isAuthenticated(): boolean {
    return !this.isTokenExpired() && !!this.tokenData;
  }

  // Helper method to get token expiry time
  getTokenExpiryTime(): Date | null {
    if (!this.tokenData) {
      return null;
    }

    return new Date(this.tokenData.obtained_at + (this.tokenData.expires_in * 1000));
  }
}