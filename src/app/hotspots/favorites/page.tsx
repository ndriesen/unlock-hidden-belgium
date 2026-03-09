import { redirect } from "next/navigation";

export default function FavoritesLegacyPage() {
  redirect("/hotspots/my?filter=favorite");
}