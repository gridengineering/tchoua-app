import { AdminSectionTabs } from "@/components/admin/admin-section-tabs";
import { GovernanceConsole } from "@/components/admin/governance-console";

export default function GovernancePage() {
  return (
    <div className="space-y-6">
      <AdminSectionTabs group="settings" />
      <GovernanceConsole />
    </div>
  );
}
