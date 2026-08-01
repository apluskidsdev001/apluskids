import type { Metadata } from "next";
import ResetPasswordPage from "@/components/auth/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password | A Plus Kids TV",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ResetPasswordPage />;
}
