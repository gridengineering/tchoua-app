import { redirect } from "next/navigation";

export default function DeprecatedWalletSettingsPage() {
  redirect("/admin/settings?tab=wallet");
}
