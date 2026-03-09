import { redirect } from "next/navigation";

export default function VisitedLegacyPage() {
  redirect("/hotspots/my?filter=visited");
}