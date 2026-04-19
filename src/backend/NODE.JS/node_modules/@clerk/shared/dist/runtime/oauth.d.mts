import { Af as OAuthProvider, Gd as OAuthStrategy, jf as OAuthProviderData } from "./index-B4_BYgBX.mjs";
import "./moduleManager-BsmFyRrH.mjs";

//#region src/oauth.d.ts
declare const OAUTH_PROVIDERS: OAuthProviderData[];
interface getOAuthProviderDataProps {
  provider?: OAuthProvider;
  strategy?: OAuthStrategy;
}
/**
 *
 */
declare function getOAuthProviderData({
  provider,
  strategy
}: getOAuthProviderDataProps): OAuthProviderData | undefined | null;
//#endregion
export { OAUTH_PROVIDERS, getOAuthProviderData };
//# sourceMappingURL=oauth.d.mts.map