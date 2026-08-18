import type { Metadata } from "next";
import LoginPage from "@/components/auth/LoginPage";

export const metadata: Metadata = {
  title: "Log In | A Plus Kids TV",
  description: "Log in to your A Plus Kids TV parent account.",
};

export default function LoginRoute() {
  return <LoginPage />;
}
