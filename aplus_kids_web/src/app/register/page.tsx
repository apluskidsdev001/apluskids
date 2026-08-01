import type { Metadata } from "next";
import RegisterPage from "@/components/auth/RegisterPage";

export const metadata: Metadata = {
  title: "Create an Account | A Plus Kids TV",
  description: "Create a parent account and safe child profiles for the A Plus Kids TV experience.",
};

export default function RegisterRoute() {
  return <RegisterPage />;
}
