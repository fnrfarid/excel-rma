export const ADMINISTRATOR = 'administrator';
export const SYSTEM_MANAGER = 'System Manager';
export const TOKEN = 'token';
export const AUTHORIZATION = 'authorization';
export const SERVICE = 'rma-server';
export const PUBLIC = 'public';
export const APP_NAME = 'rma-server';
export const SWAGGER_ROUTE = 'api-docs';
export enum ConnectedServices {
  CommunicationServer = 'communication-server',
  InfrastructureConsole = 'infrastructure-console',
  IdentityProvider = 'identity-provider',
}
export const BEARER_HEADER_VALUE_PREFIX = 'Bearer ';
export const APPLICATION_JSON_CONTENT_TYPE = 'application/json';
export const CONTENT_TYPE_HEADER_KEY = 'Content-Type';
export const GLOBAL_API_PREFIX = 'api';
export const PASSWORD = 'password';
export const REFRESH_TOKEN = 'refresh_token';
export const OPENID = 'openid';
export const CONTENT_TYPE = 'content-type';
export const APP_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded';
export const APP_JSON = 'application/json';
export const TEN_MINUTES_IN_SECONDS = 600;
export const REDIRECT_ENDPOINT = '/api/direct/callback';
export const PROFILE_ENDPOINT =
  '/api/method/frappe.integrations.oauth2.openid_profile';
export const AUTH_ENDPOINT = '/api/method/frappe.integrations.oauth2.authorize';
export const REVOKE_ENDPOINT =
  '/api/method/frappe.integrations.oauth2.revoke_token';
export const TOKEN_ENDPOINT =
  '/api/method/frappe.integrations.oauth2.get_token';
export const TWENTY_MINUTES_IN_SECONDS = 20 * 60; // 20 min * 60 sec;
export const SCOPE = 'all openid';
export const ACTIVE = 'Active';
export const CUSTOMER_ALREADY_EXISTS = 'Customer already exists';
export const ITEM_ALREADY_EXISTS = 'Item already exists';
export const SUPPLIER_ALREADY_EXISTS = 'Supplier already exists';
