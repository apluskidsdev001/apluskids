import ContentPageAdmin from "@/components/admin/ContentPageAdmin";
import { defaultKidsZoneContent } from "@/components/admin/adminData";

export default function AdminKidsZonePage() {
  return <ContentPageAdmin pageName="Kids Zone" description="Manage Hero, Birthday, Kids Champ and Events titles, descriptions and action links." storageKey="aplus-admin-kids-zone-content" publishedKey="aplus-published-kids-zone-content" defaultItems={defaultKidsZoneContent} previewUrl="/kids-zone" />;
}
