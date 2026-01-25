import { useFilterPanelStore } from '@/store/filterPanelStore';

export const useFilterPanel = () => {
  const { isOpen, togglePanel, openPanel, closePanel } = useFilterPanelStore();

  return {
    isFilterPanelOpen: isOpen,
    toggleFilterPanel: togglePanel,
    openFilterPanel: openPanel,
    closeFilterPanel: closePanel,
  };
};
