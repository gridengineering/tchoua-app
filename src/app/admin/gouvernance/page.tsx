import { redirect } from "next/navigation";

export default function DeprecatedGovernancePage() {
  redirect("/admin/settings?tab=gouvernance");
}
