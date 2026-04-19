import { Qa as JwtPayload, T as SharedSignedInAuthObjectProperties } from "./index-B4_BYgBX.mjs";
import "./moduleManager-BsmFyRrH.mjs";

//#region src/jwtPayloadParser.d.ts
declare const parsePermissions: ({
  per,
  fpm
}: {
  per?: string;
  fpm?: string;
}) => {
  permissions: string[];
  featurePermissionMap: number[][];
};
/**
 * Resolves the signed-in auth state from JWT claims.
 *
 * @experimental
 */
declare const __experimental_JWTPayloadToAuthObjectProperties: (claims: JwtPayload) => SharedSignedInAuthObjectProperties;
//#endregion
export { __experimental_JWTPayloadToAuthObjectProperties, parsePermissions };
//# sourceMappingURL=jwtPayloadParser.d.mts.map