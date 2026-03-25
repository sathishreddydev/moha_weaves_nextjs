'use client';

import { useSession } from 'next-auth/react';

export class AuthTokenManager {
  private static refreshPromise: Promise<any> | null = null;

  // Get current access token from session
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get from session first
    const sessionData = this.getSessionFromStorage();
    if (sessionData?.accessToken) {
      return sessionData.accessToken;
    }
    
    return null;
  }

  // Get session from localStorage (fallback)
  private static getSessionFromStorage(): any {
    try {
      const session = localStorage.getItem('next-auth.session-token');
      if (!session) return null;
      
      // Parse JWT payload
      const parts = session.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token expires within 5 minutes
      return payload.exp && payload.exp < (now + 300);
    } catch {
      return true;
    }
  }

  // Refresh token automatically
  static async refreshToken(): Promise<boolean> {
    // Prevent multiple refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result.success;
    } finally {
      this.refreshPromise = null;
    }
  }

  private static async performTokenRefresh(): Promise<any> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        // Store new tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Clear invalid tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return { success: false, error };
    }
  }

  // Get auth headers with automatic token refresh
  static async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    let token = this.getAccessToken();

    // Check if token needs refresh
    if (token && this.isTokenExpired(token)) {
      const refreshSuccess = await this.refreshToken();
      if (refreshSuccess) {
        token = this.getAccessToken();
      } else {
        return headers; // Return without auth header if refresh failed
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Logout and clear tokens
  static logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('next-auth.session-token');
    localStorage.removeItem('next-auth.csrf-token');
  }
}
