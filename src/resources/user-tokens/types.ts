export interface GenerateTokenRequest {
  /**
   * User login. If not set, the token is generated for the authenticated user.
   */
  login?: string;
  /**
   * Token name
   * Maximum length: 100
   */
  name: string;
}

export interface GenerateTokenResponse {
  /**
   * User login
   */
  login: string;
  /**
   * Token name
   */
  name: string;
  /**
   * Token value
   */
  token: string;
  /**
   * Token creation date
   */
  createdAt: string;
}

export interface RevokeTokenRequest {
  /**
   * User login
   */
  login?: string;
  /**
   * Token name
   */
  name: string;
}

export interface SearchTokensRequest {
  /**
   * User login
   */
  login?: string;
}

export interface UserToken {
  /**
   * Token name
   */
  name: string;
  /**
   * Token creation date
   */
  createdAt: string;
  /**
   * Last connection date. Only updated every hour.
   * Available since SonarQube 7.7
   */
  lastConnectionDate?: string;
}

export interface SearchTokensResponse {
  /**
   * User login
   */
  login: string;
  /**
   * List of user tokens
   */
  userTokens: UserToken[];
}
