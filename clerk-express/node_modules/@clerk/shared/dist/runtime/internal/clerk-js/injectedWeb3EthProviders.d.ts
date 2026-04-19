import { if as OKXWalletWeb3Provider, rf as MetamaskWeb3Provider } from "../../index-gwPUTb24.js";
import "../../moduleManager-WB15hU3T.js";

//#region src/internal/clerk-js/injectedWeb3EthProviders.d.ts
type InjectedWeb3EthProvider = MetamaskWeb3Provider | OKXWalletWeb3Provider;
declare class InjectedWeb3EthProviders {
  #private;
  private constructor();
  static getInstance(): InjectedWeb3EthProviders;
  get: (provider: InjectedWeb3EthProvider) => any;
}
declare const getInjectedWeb3EthProviders: () => InjectedWeb3EthProviders;
//#endregion
export { getInjectedWeb3EthProviders };
//# sourceMappingURL=injectedWeb3EthProviders.d.ts.map