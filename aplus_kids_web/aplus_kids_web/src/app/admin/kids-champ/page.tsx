import { Suspense } from "react";
import KidsChampAdmin from "@/components/admin/KidsChampAdmin";

function KidsChampLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F3F6FA] text-sm font-medium text-[#68758A]">
      Loading Kids Champ operations...
    </div>
  );
}

export default function KidsChampAdminPage() {
  return (
    <Suspense fallback={<KidsChampLoading />}>
      <KidsChampAdmin />
    </Suspense>
  );
}
