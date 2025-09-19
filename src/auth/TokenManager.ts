import { TokenData } from '../types/auth';
import * as fs from 'fs';
import * as path from 'path';

export class TokenManager {
  private tokenData: TokenData | null = null;
  private readonly tokenExpiryBuffer = 300; // 5 minutes buffer before expiry
  private readonly tokenFilePath: string;

  constructor(tokenFilePath?: string) {
    this.tokenFilePath = tokenFilePath || path.join(process.cwd(), '.tokens.json');
    this.loadTokensFromFile();
  }

  setTokenData(tokenData: TokenData): void {
    this.tokenData = {
      ...tokenData,
      obtained_at: Date.now()
    };
    this.saveTokensToFile();
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
    this.deleteTokenFile();
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

  // File operations for persistent storage
  private loadTokensFromFile(): void {
    try {
      if (fs.existsSync(this.tokenFilePath)) {
        const fileContent = fs.readFileSync(this.tokenFilePath, 'utf8');
        const tokenData = JSON.parse(fileContent) as TokenData;

        // Only load if token is still valid or has refresh token
        if (!this.isTokenDataExpired(tokenData) || tokenData.refresh_token) {
          this.tokenData = tokenData;
        } else {
          // Clean up expired token file
          this.deleteTokenFile();
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not load tokens from ${this.tokenFilePath}:`, (error as Error).message);
      // If file is corrupted, delete it
      this.deleteTokenFile();
    }
  }

  private saveTokensToFile(): void {
    try {
      if (this.tokenData) {
        fs.writeFileSync(this.tokenFilePath, JSON.stringify(this.tokenData, null, 2));
      }
    } catch (error) {
      console.error(`Error saving tokens to ${this.tokenFilePath}:`, (error as Error).message);
    }
  }

  private deleteTokenFile(): void {
    try {
      if (fs.existsSync(this.tokenFilePath)) {
        fs.unlinkSync(this.tokenFilePath);
      }
    } catch (error) {
      console.warn(`Warning: Could not delete token file ${this.tokenFilePath}:`, (error as Error).message);
    }
  }

  private isTokenDataExpired(tokenData: TokenData): boolean {
    if (!tokenData) {
      return true;
    }

    const now = Date.now();
    const expiresAt = tokenData.obtained_at + (tokenData.expires_in * 1000);

    // Use buffer to refresh before actual expiry
    return now >= (expiresAt - (this.tokenExpiryBuffer * 1000));
  }
}