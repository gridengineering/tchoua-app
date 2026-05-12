import { redirect } from "next/navigation";

export default function NewAssociationPage() {
  redirect("/dashboard/associations/create");
}
