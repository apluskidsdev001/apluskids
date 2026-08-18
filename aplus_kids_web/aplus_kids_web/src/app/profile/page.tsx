import type { Metadata } from "next";
import ProfileDashboard from "@/components/profile/ProfileDashboard";

export const metadata: Metadata = {
  title: "My Profile | A Plus Kids TV",
  description: "View and manage your A Plus Kids TV profile, achievements, wishlist and account activity.",
};

export default function ProfilePage() {
  return <ProfileDashboard />;
}
