import { redirect } from "next/navigation";

export default function WishlistLegacyPage() {
  redirect("/hotspots/my?filter=wishlist");
}