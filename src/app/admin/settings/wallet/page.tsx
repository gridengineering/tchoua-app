import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { WalletSettingsPanel } from "@/components/admin/wallet-settings-panel";

export default function WalletSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs group="wallets" />
      <WalletSettingsPanel />
    </div>
  );
}
