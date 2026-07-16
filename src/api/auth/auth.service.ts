import { handleAsync } from "../../utils";
import { useStore } from "../../store/store";

import {
  TAuthLoginRequestPayload,
  TAuthLoginResponsePayload,
  TAuthRefreshAccessTokenRequestPayload,
  TAuthRefreshAccessTokenResponsePayload,
} from "./auth.types";

import { ApiService, TApiServiceError, TApiServiceOptions } from "../apiService";

const apiService = new ApiService();

export type TBackendAuthResponse = {
  code: number;
  status: string;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    position?: string;
    status?: string;
  };
  tokens: {
    access: {
      token: string;
      expires: string;
    };
    refresh: {
      token: string;
      expires: string;
    };
  };
};

class AuthService {
  rootEndpoint = `auth` as const;
  loginEndpoint = `${this.rootEndpoint}/login` as const;
  logoutEndpoint = `${this.rootEndpoint}/logout` as const;
  signupEndpoint = `${this.rootEndpoint}/register` as const;
  forgotPasswordEndpoint = `${this.rootEndpoint}/forgot-password` as const;
  refreshAccessTokenEndpoint = `${this.rootEndpoint}/refresh-tokens` as const;

  // methods
  async login(payload: TAuthLoginRequestPayload, options?: TApiServiceOptions): Promise<{ data: TAuthLoginResponsePayload; error: null } | { data: null; error: TApiServiceError }> {
    const result = await handleAsync<TApiServiceError, any>(() =>
      apiService.post(this.loginEndpoint, payload, options)
    );

    if (result.data) {
      const backendData = result.data as TBackendAuthResponse;
      const formattedData: TAuthLoginResponsePayload = {
        user: {
          id: backendData.user.id,
          username: backendData.user.email,
          name: backendData.user.name,
          email: backendData.user.email,
          role: (backendData.user.role === "admin" || backendData.user.role === "super_admin" || backendData.user.role === "super admin") ? "admin" : "basic", // Map to frontend's predefined roles
          rawRole: backendData.user.role,
          appSettings: { theme: "light", lng: "en" },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // include extra fields for HRIS layout
          department: backendData.user.department || "General",
          position: backendData.user.position || "Staff",
          status: backendData.user.status || "active",
        } as any,
        accessToken: backendData.tokens.access.token,
        refreshToken: backendData.tokens.refresh.token,
        expiresAt: new Date(backendData.tokens.access.expires).getTime(),
      };
      return { data: formattedData, error: null };
    }
    return { data: null, error: result.error! };
  }

  logout(options?: TApiServiceOptions) {
    const { refreshToken } = useStore.getState();
    return apiService.post<void>(this.logoutEndpoint, { refresh_token: refreshToken }, options);
  }

  async refreshAccessToken(payload: TAuthRefreshAccessTokenRequestPayload, options?: TApiServiceOptions): Promise<{ data: TAuthRefreshAccessTokenResponsePayload; error: null } | { data: null; error: TApiServiceError }> {
    const result = await handleAsync<TApiServiceError, any>(() =>
      apiService.post(this.refreshAccessTokenEndpoint, { refresh_token: payload.refreshToken }, options)
    );

    if (result.data) {
      const backendData = result.data as { tokens: { access: { token: string, expires: string }, refresh: { token: string, expires: string } } };
      const formattedData: TAuthRefreshAccessTokenResponsePayload = {
        accessToken: backendData.tokens.access.token,
        refreshToken: backendData.tokens.refresh.token,
        expiresAt: new Date(backendData.tokens.access.expires).getTime(),
      };
      return { data: formattedData, error: null };
    }
    return { data: null, error: result.error! };
  }
}

export const authService = new AuthService();
