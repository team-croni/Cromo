import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CustomDateRangePicker } from '@components/ui/custom-date-range-picker';
import { useSearchParams } from 'next/navigation';

export function MemoBrowserFilterSection() {
  const { filterOptions, activeMode, updateFilterOptions, setActiveMode } = useMemoBrowserStore();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  const defaultFilters = {
    showArchived: true as const,
    sortBy: 'updatedAt' as const,
    sortDirection: 'desc' as const,
    showLiveShareTop: true as const,
    groupBy: 'none' as const,
    dateFrom: null,
    dateTo: null,
  };

  const isAtDefault = JSON.stringify(filterOptions) === JSON.stringify(defaultFilters);

  const resetFilters = () => {
    updateFilterOptions(defaultFilters);
  };

  const closeFilter = () => {
    setActiveMode('none');
  };

  return (
    <>
      <div
        className={`absolute top-0 left-0 w-full h-full z-10 bg-black/30 duration-150 ${activeMode === 'filter' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeFilter}
      />
      <div className={`absolute w-full z-20 ${activeMode === 'filter' ? '' : 'pointer-events-none'}`}>
        <div className={`absolute w-full left-1/2 -translate-x-1/2 transition-all border-b duration-150 z-10 bg-background origin-top ${activeMode === 'filter' ? 'translate-y-0 opacity-100' : 'translate-y-[-10px] opacity-0'}`}>
          <div className="flex flex-col items-start p-4 pt-0 z-0 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground/70">수정 기간</p>
              <CustomDateRangePicker
                value={{ from: filterOptions.dateFrom ?? null, to: filterOptions.dateTo ?? null }}
                onChange={(range) => updateFilterOptions({ dateFrom: range.from, dateTo: range.to })}
                placeholder="기간 선택"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground/70">필터 옵션</p>
              <div className="flex gap-6">
                {(!activeTab || activeTab === 'recent') &&
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOptions.showArchived}
                      onChange={(e) => updateFilterOptions({ showArchived: e.target.checked })}
                      className="w-5 h-5 mr-2.5"
                    />
                    <span className="text-sm">보관된 메모 표시</span>
                  </label>
                }
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOptions.showLiveShareTop}
                    onChange={(e) => updateFilterOptions({ showLiveShareTop: e.target.checked })}
                    className="w-5 h-5 mr-2.5"
                  />
                  <span className="text-sm">라이브 상단 표시</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground/70">그룹 기준</p>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="groupBy"
                    value="none"
                    checked={filterOptions.groupBy === 'none'}
                    onChange={() => updateFilterOptions({ groupBy: 'none' })}
                    className="w-5 h-5 mr-2.5"
                  />
                  <span className="text-sm">기본</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="groupBy"
                    value="monthly"
                    checked={filterOptions.groupBy === 'monthly'}
                    onChange={() => updateFilterOptions({ groupBy: 'monthly' })}
                    className="w-5 h-5 mr-2.5"
                  />
                  <span className="text-sm">월별</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground/70">정렬 기준</p>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value="updatedAt"
                    checked={filterOptions.sortBy === 'updatedAt'}
                    onChange={() => updateFilterOptions({ sortBy: 'updatedAt' })}
                    className="w-5 h-5 mr-2.5"
                  />
                  <span className="text-sm">수정일 순</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value="createdAt"
                    checked={filterOptions.sortBy === 'createdAt'}
                    onChange={() => updateFilterOptions({ sortBy: 'createdAt' })}
                    className="w-5 h-5 mr-2.5"
                  />
                  <span className="text-sm">생성일 순</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value="title"
                    checked={filterOptions.sortBy === 'title'}
                    onChange={() => updateFilterOptions({ sortBy: 'title' })}
                    className="w-5 h-5 mr-2.5"
                  />
                  <span className="text-sm">제목 순</span>
                </label>
              </div>
            </div>
            <div className='flex items-center'>
              <button
                onClick={() => updateFilterOptions({ sortDirection: filterOptions.sortDirection === 'desc' ? 'asc' : 'desc' })}
                className="flex items-center cursor-pointer border border-popover-border hover:border-foreground/30 text-xs text-muted-foreground hover:text-foreground rounded-lg pl-2 pr-2.5 py-1.5"
              >
                {filterOptions.sortDirection === 'desc' ?
                  <>
                    <ArrowDown className="w-3 h-3 mr-1.5" />
                    <span>내림차순</span>
                  </>
                  :
                  <>
                    <ArrowUp className="w-3 h-3 mr-1.5" />
                    <span>오름차순</span>
                  </>
                }
              </button>
            </div>
            <div className="flex self-stretch justify-end gap-0.5 text-sm mb-0">
              <button
                className='px-3 py-1.5 text-primary rounded-lg disabled:text-muted-foreground/50 disabled:cursor-default not-disabled:hover:bg-muted-foreground/5'
                onClick={resetFilters}
                disabled={isAtDefault}
              >
                초기화
              </button>
              <button
                className='px-3 py-1.5 text-foreground hover:text-foreground hover:bg-muted-foreground/5 rounded-lg'
                onClick={closeFilter}
              >
                닫기
              </button>
            </div>
            <div className='absolute -bottom-8 left-0 w-full h-8 bg-linear-to-b to-transparent from-black/15' />
          </div>
        </div>
      </div>
    </>
  );
}