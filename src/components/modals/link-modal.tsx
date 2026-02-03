"use client";

import { useEffect, useState, useRef } from "react";
import { Modal } from "@components/ui/modal";
import {
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
  ModalSection,
} from "@components/modals/formatted-modal-content";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  initialUrl?: string;
}

export function LinkModal({
  isOpen,
  onClose,
  onSave,
  initialUrl = "",
}: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      // 모달이 열릴 때 입력 필드 자동 선택
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, initialUrl]);

  const handleSave = () => {
    onSave(url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-96 bg-background border rounded-2xl"
    >
      <ModalHeader title="링크 설정" />
      <ModalBody>
        <ModalSection title="URL">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-3 py-3 w-full"
            placeholder="https://example.com"
          />
        </ModalSection>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose}>취소</ModalButton>
        <ModalButton type="primary" onClick={handleSave}>
          저장
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}
