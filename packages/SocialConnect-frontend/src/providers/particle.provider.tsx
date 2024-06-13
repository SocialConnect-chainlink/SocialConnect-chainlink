import { AvalancheTestnet } from "@particle-network/chains";
import { AuthType } from "@particle-network/auth-core";
import { AuthCoreContextProvider, PromptSettingType } from "@particle-network/auth-core-modal";

export default function ParticleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCoreContextProvider
      options={{
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
        clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
        appId: process.env.NEXT_PUBLIC_APP_ID!,
        authTypes: [AuthType.email, AuthType.google, AuthType.twitter, AuthType.facebook],
        themeType: "dark",
        fiatCoin: "USD",
        language: "en",
        erc4337: {
          name: "SIMPLE",
          version: "1.0.0",
        },
        promptSettingConfig: {
          promptPaymentPasswordSettingWhenSign: PromptSettingType.first,
          promptMasterPasswordSettingWhenLogin: PromptSettingType.first,
        },
        wallet: {
          visible: true,
          customStyle: {
            supportChains: [AvalancheTestnet],
          },
        },
      }}
    >
      {children}
    </AuthCoreContextProvider>
  );
}
