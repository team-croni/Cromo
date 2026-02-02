import { Settings, Globe, Edit3, Eye, Users, UserPlus } from 'lucide-react';
import { DropdownSection, DropdownItem } from "@components/ui/formatted-dropdown-content";
import { useMemo } from '@hooks/useMemo';
import { Ring } from 'ldrs/react';
import { useEditorSave } from '@hooks/useEditorSave';
import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@store/editorStore';

export function LiveShareSettingsDropdown() {
  const { updateLiveShareSettings } = useEditorSave();
  const { isLiveShareLoading } = useEditorStore();
  const { data: memoData, isLoading: isMemoLoading } = useMemo();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleTriggerClick}
        className="cursor-pointer"
      >
        <div
          className={`px-2 py-2 text-xs  flex items-center rounded-full hover:text-foreground ${isOpen ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {isMemoLoading ? (
            <Ring
              size="12"
              speed="2"
              stroke={1.5}
              color="currentColor"
              bgOpacity={0.2}
            />
          ) : <Settings className='w-3 h-3 mr-2' />
          }
          설정
        </div>
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 flex items-center justify-center z-100"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute overflow-hidden mt-2 min-w-40 bg-background border rounded-2xl shadow-xl/20 z-100 px-2 py-2.5 right-0`}
          >
            <div className={`absolute inset-0 z-50 ${isLiveShareLoading ? 'bg-background opacity-50' : 'pointer-events-none opacity-0'}`} />
            <div className="space-y-1">
              <DropdownSection title="접근 권한">
                <DropdownItem
                  label="모두 허용"
                  icon={<Globe className="w-4 h-4" />}
                >
                  <input
                    type="radio"
                    name="liveShareMode"
                    value="public"
                    checked={memoData?.liveShareMode === 'public'}
                    onChange={() => updateLiveShareSettings({ liveShareMode: 'public' })}
                    className='w-5 h-5 focus:outline-none'
                  />
                </DropdownItem>
                <DropdownItem
                  label="회원만 허용"
                  icon={<Users className="w-4 h-4" />}
                  className='pointer-events-none opacity-30'
                >
                  <input
                    type="radio"
                    name="liveShareMode"
                    value="private"
                    checked={memoData?.liveShareMode === 'private'}
                    onChange={() => updateLiveShareSettings({ liveShareMode: 'private' })}
                    className='w-5 h-5 focus:outline-none'
                  />
                </DropdownItem>
                <DropdownItem
                  label="사용자 지정"
                  icon={<UserPlus className="w-4 h-4" />}
                  className='pointer-events-none opacity-30'
                >
                  <input
                    type="radio"
                    name="liveShareMode"
                    value="private"
                    checked={memoData?.liveShareMode === 'private'}
                    onChange={() => updateLiveShareSettings({ liveShareMode: 'private' })}
                    className='w-5 h-5 focus:outline-none'
                  />
                </DropdownItem>
              </DropdownSection>

              <DropdownSection title="편집 권한">
                <DropdownItem
                  label="쓰기/읽기 허용"
                  icon={<Edit3 className="w-4 h-4" />}
                >
                  <input
                    type="radio"
                    name="liveSharePermission"
                    value="readWrite"
                    checked={memoData?.liveSharePermission === 'readWrite'}
                    onChange={() => updateLiveShareSettings({ liveSharePermission: 'readWrite' })}
                    className='w-5 h-5 focus:outline-none'
                  />
                </DropdownItem>

                <DropdownItem
                  label="읽기만 허용"
                  icon={<Eye className="w-4 h-4" />}
                >
                  <input
                    type="radio"
                    name="liveSharePermission"
                    value="readOnly"
                    checked={memoData?.liveSharePermission === 'readOnly'}
                    onChange={() => updateLiveShareSettings({ liveSharePermission: 'readOnly' })}
                    className='w-5 h-5 focus:outline-none'
                  />
                </DropdownItem>
              </DropdownSection>
            </div>
          </div>
        </>
      )}
    </div>
  );
}