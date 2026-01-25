import { FolderEditModal } from "@components/modals/folder-edit-modal";
import { Sidebar } from "@components/sidebar";
import { MobileHeader } from "@components/layout/mobile-header";

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <MobileHeader />
      <Sidebar />
      <main className="flex-1 pt-16 md:pt-0">
        <div className="flex flex-col h-full md:flex-row overflow-hidden">
          {children}
          <FolderEditModal />
        </div>
      </main>
    </>
  );
}
