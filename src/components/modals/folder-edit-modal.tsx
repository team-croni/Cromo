"use client"

import { useEffect, useState, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import CustomTooltip from '@components/ui/custom-tooltip';
import { AVAILABLE_COLOR_NAMES, AVAILABLE_COLORS, AVAILABLE_ICON_NAMES, AVAILABLE_ICONS } from '@constants/folder-constants';
import { useFolderEditModal } from '@hooks/useFolderEditModal';
import { useMemos } from '@hooks/useMemos';
import { useFolderEditModalStore } from '@store/folderEditModalStore';
import { Ring } from 'ldrs/react';
import { ModalBody, ModalButton, ModalFooter, ModalHeader, ModalSection } from '@components/modals/formatted-modal-content';
import { Modal } from '@components/ui/modal';

// 색상 이름에서 해당하는 Tailwind 색상 클래스 찾기
const getTextColorClass = (colorName: string): string => {
  const colorMap = {
    gray: 'text-gray-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
    cyan: 'text-cyan-500',
    teal: 'text-teal-500',
    emerald: 'text-emerald-500',
  };

  return colorMap[colorName as keyof typeof colorMap] || 'text-gray-500';
};

interface IconGridProps {
  onIconSelect: (iconName: string) => void;
  selectedIcon: string;
  selectedColor: string;
}

const IconGrid: React.FC<IconGridProps> = ({ onIconSelect, selectedIcon, selectedColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // 선택된 아이콘이 변경될 때마다 해당 위치로 스크롤
  useEffect(() => {
    if (selectedIcon && iconRefs.current[selectedIcon] && containerRef.current) {
      const selectedElement = iconRefs.current[selectedIcon];
      const container = containerRef.current;

      // 선택된 요소의 위치 계산
      const elementTop = selectedElement?.offsetTop || 0;
      const elementBottom = elementTop + (selectedElement?.offsetHeight || 0);
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.offsetHeight;

      // 요소가 컨테이너 바깥에 있는지 확인
      if (elementTop < containerTop || elementBottom > containerBottom) {
        // 부드러운 스크롤로 해당 위치로 이동
        selectedElement?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [selectedIcon]);

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-7 p-2 pr-3 gap-2 max-h-48 bg-input border border-input-border scrollbar-full rounded-lg overflow-y-auto"
    >
      {AVAILABLE_ICONS.map((iconName) => {
        const IconComponent = (LucideIcons as any)[iconName];

        if (!IconComponent) {
          console.warn(`Icon ${iconName} not found in lucide-react`);
          return null;
        }

        const isSelected = selectedIcon === iconName;

        return (
          <button
            key={iconName}
            ref={(el) => {
              iconRefs.current[iconName] = el;
            }}
            onClick={() => onIconSelect(iconName)}
            className={`
                flex items-center justify-center aspect-square rounded-lg border hover:bg-foreground/5
                ${isSelected
                ? 'border-primary bg-primary/10'
                : 'border-transparent hover:border-foreground/20'
              }
              `}
            title={iconName}
          >
            <IconComponent className={`w-6 h-6 ${getTextColorClass(selectedColor)}`} />
          </button>
        );
      })}
    </div>
  );
};

interface ColorGridProps {
  onColorSelect: (color: string) => void;
  selectedColor: string;
}

const ColorGrid: React.FC<ColorGridProps> = ({ onColorSelect, selectedColor }) => {
  return (
    <div className="p-2 grid grid-cols-9 flex-wrap gap-3">
      {AVAILABLE_COLORS.map((color) => {
        const isSelected = selectedColor === color.name;

        return (
          <button
            key={color.name}
            onClick={() => onColorSelect(color.name)}
            className={`
                aspect-square rounded-full transition-all duration-75 hover:scale-115
                ${color.class}
                ${isSelected
                ? 'outline-[1.5px] outline-foreground outline-offset-3 shadow-lg'
                : 'hover:border-foreground/50'
              }
              `}
            title={color.label}
          />
        );
      })}
    </div>
  );
};

export const FolderEditModal = () => {
  const [localEditingName, setLocalEditingName] = useState('');
  const [localSelectedIcon, setLocalSelectedIcon] = useState('');
  const [localSelectedColor, setLocalSelectedColor] = useState('yellow');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { editingFolder, updateEditingFolder } = useFolderEditModalStore();
  const { modalProps } = useFolderEditModal();
  // useMemos 훅을 사용하여 폴더의 메모 데이터를 가져옵니다.
  const { folderMemos, folderMemosLoading } = useMemos();

  // 현재 editingFolder.id와 일치하는 메모만 필터링
  const currentFolderMemos = useMemo(() => {
    return folderMemos.filter(memo => memo.folderId === editingFolder?.id);
  }, [folderMemos, editingFolder?.id]);

  // 메모 내용을 합친 길이 계산
  const combinedContentLength = useMemo(() => {
    if (!currentFolderMemos || currentFolderMemos.length === 0) {
      return 0;
    }
    return currentFolderMemos.reduce((totalLength: number, memo: { title: string | null; content: string | null }) => {
      const title = memo.title || "";
      const content = memo.content || "";
      return totalLength + title.length + content.length;
    }, 0);
  }, [currentFolderMemos]);

  // hasMemos 상태를 combinedContentLength를 기반으로 설정
  const hasMemos = combinedContentLength > 0;

  // AI 폴더명 생성
  const handleAiFolderName = async () => {
    if (!hasMemos || !editingFolder || combinedContentLength < 50) return; // 길이 조건 추가

    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/ai-folder-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: editingFolder.id }),
      });

      if (response.ok) {
        const data = await response.json();

        // 허용된 아이콘과 색상인지 추가 검증
        const isValidIcon = data.icon && AVAILABLE_ICON_NAMES.includes(data.icon);
        const isValidColor = data.color && AVAILABLE_COLOR_NAMES.includes(data.color);

        // 드롭다운에 선택된 값 업데이트 (즉시 저장하지 않음)
        if (data.title) {
          setLocalEditingName(data.title);
          updateEditingFolder({ name: data.title });
        }
        if (data.icon && isValidIcon) {
          setLocalSelectedIcon(data.icon);
          updateEditingFolder({ icon: data.icon });
        } else if (data.icon && !isValidIcon) {
          console.warn('AI가 반환한 아이콘이 지원되지 않음:', data.icon, '사용 가능한 아이콘:', AVAILABLE_ICON_NAMES);
        }
        if (data.color && isValidColor) {
          setLocalSelectedColor(data.color);
          updateEditingFolder({ color: data.color });
        } else if (data.color && !isValidColor) {
          console.warn('AI가 반환한 색상이 지원되지 않음:', data.color, '사용 가능한 색상:', AVAILABLE_COLOR_NAMES);
        }
      } else {
        const errorData = await response.json();
        console.error('AI folder name generation failed:', errorData.error);
        alert('AI 폴더명 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Error generating AI folder name:', error);
      alert('AI 폴더명 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // folder가 변경될 때 상태 초기화
  useEffect(() => {
    if (editingFolder) {
      setLocalEditingName(editingFolder.name || '');
      setLocalSelectedIcon(editingFolder.icon || 'Folder');
      setLocalSelectedColor(editingFolder.color || 'yellow');
      // 모달이 열릴 때 입력 필드 자동 선택
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editingFolder]);

  const handleUpdate = async () => {
    if (editingFolder && localEditingName.trim()) {
      setIsUpdating(true);
      try {
        await modalProps.onUpdate(editingFolder.id, localEditingName.trim(), localSelectedIcon, localSelectedColor);
        modalProps.onClose();
      } catch (error) {
        console.error('폴더 업데이트 실패:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <Modal className="w-full max-w-104 bg-background border rounded-2xl">
      <ModalHeader title="폴더 설정">
        <CustomTooltip
          message={
            folderMemosLoading
              ? "메모 내용을 불러오는 중입니다..."
              : !hasMemos
                ? "폴더에 메모가 없습니다"
                : combinedContentLength < 50
                  ? `메모 내용이 충분하지 않습니다 (최소 50자)`
                  : "AI 추천"
          }
          hover={
            (folderMemosLoading || !hasMemos || combinedContentLength < 50) &&
            !isAiGenerating
          }
          position="bottom"
          align="end"
        >
          <button
            onClick={() => {
              if (!isAiGenerating) {
                handleAiFolderName();
              }
            }}
            disabled={folderMemosLoading || isAiGenerating || combinedContentLength < 50}
            className={`not-disabled:group flex items-center py-1.5 px-2.5 -my-1.5 -mr-2.5 text-sm rounded-lg not-disabled:hover:bg-muted-foreground/5 ${(!hasMemos || combinedContentLength < 50) ? 'text-muted-foreground opacity-50 cursor-default' : 'text-primary'
              }`}
          >
            {isAiGenerating ? (
              <div className='flex items-center justify-center w-4 h-4 text-primary mr-2'>
                <Ring
                  size="16"
                  speed="2"
                  stroke={2}
                  color="currentColor"
                  bgOpacity={0.2}
                />
              </div>
            ) : (
              <LucideIcons.Wand2 className="w-4 h-4 mr-2" />
            )}
            <span className='text-muted-foreground group-hover:text-foreground'>AI 추천</span>
          </button>
        </CustomTooltip>
      </ModalHeader>
      <ModalBody>
        <ModalSection title="이름">
          <input
            ref={inputRef}
            value={localEditingName}
            onChange={(e) => setLocalEditingName(e.target.value)}
            disabled={isUpdating}
            className="px-3 py-3 disabled:opacity-50 w-full"
            placeholder="폴더 이름"
          />
        </ModalSection>

        <ModalSection title="아이콘">
          <IconGrid
            onIconSelect={(icon) => {
              setLocalSelectedIcon(icon);
              updateEditingFolder({ icon });
            }}
            selectedIcon={localSelectedIcon}
            selectedColor={localSelectedColor}
          />
        </ModalSection>

        <ModalSection className="pt-4">
          <ColorGrid
            onColorSelect={(color) => {
              setLocalSelectedColor(color);
              updateEditingFolder({ color });
            }}
            selectedColor={localSelectedColor}
          />
        </ModalSection>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={modalProps.onClose}>
          취소
        </ModalButton>
        <ModalButton
          type="primary"
          onClick={handleUpdate}
          disabled={isUpdating || !localEditingName.trim()}
        >
          {isUpdating ?
            <div className="flex items-center justify-center w-full h-4">
              <Ring size="16" speed="2" stroke={2} color="currentColor" bgOpacity={0.2} />
            </div>
            :
            '저장'
          }
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
