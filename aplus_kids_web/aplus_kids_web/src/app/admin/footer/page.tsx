import ContentPageAdmin from "@/components/admin/ContentPageAdmin";
import { defaultFooterContent } from "@/components/admin/adminData";

export default function AdminFooterPage() {
  return <ContentPageAdmin pageName="Footer" description="Manage brand content, contact details, navigation labels and social links." storageKey="aplus-admin-footer-content" publishedKey="aplus-published-footer-content" defaultItems={defaultFooterContent} previewUrl="/?footerPreview=1" />;
}
