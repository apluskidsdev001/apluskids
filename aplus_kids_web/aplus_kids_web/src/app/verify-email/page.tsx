import type { Metadata } from "next";
import VerifyEmailPage from "@/components/auth/VerifyEmailPage";

export const metadata: Metadata = {
  title: "Verify Email | A Plus Kids TV",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <VerifyEmailPage />;
}
