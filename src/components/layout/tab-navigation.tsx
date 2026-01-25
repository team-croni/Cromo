import { Clock8, Pin, Folder } from "lucide-react";

interface TabNavigationProps {
  activeTab: 'recent' | 'pinned' | 'folders';
  setActiveTab: (tab: 'recent' | 'pinned' | 'folders') => void;
}

export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <div className="flex gap-4 border-b px-3">
      <button
        className={`flex-1 flex justify-center items-center py-4 border-b-3 text-sm ${activeTab === 'recent'
          ? 'border-primary text-foreground font-bold'
          : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        onClick={() => setActiveTab('recent')}
      >
        <Clock8 className="w-3.5 h-3.5 mr-2.5" />
        <span>최근 수정</span>
      </button>
      <button
        className={`flex-1 flex justify-center items-center py-4 border-b-3 text-sm ${activeTab === 'pinned'
          ? 'border-primary text-foreground font-bold'
          : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        onClick={() => setActiveTab('pinned')}
      >
        <Pin className="w-3.5 h-3.5 mr-2.5" />
        <span>고정됨</span>
      </button>
      <button
        className={`flex-1 flex justify-center items-center py-4 border-b-3 text-sm ${activeTab === 'folders'
          ? 'border-primary text-foreground font-bold'
          : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        onClick={() => setActiveTab('folders')}
      >
        <Folder className="w-3.5 h-3.5 mr-2.5" />
        <span>폴더</span>
      </button>
    </div>
  );
}