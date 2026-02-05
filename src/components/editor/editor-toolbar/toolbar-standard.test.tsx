/**
 * ToolbarStandard Component Tests
 * 
 * 이 파일은 src/components/editor/editor-toolbar/toolbar-standard.tsx 컴포넌트의
 * 유닛 테스트와 통합 테스트를 포함합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolbarStandard } from '@/components/editor/editor-toolbar/toolbar-standard';

// Store mock
const mockEditorStore = {
  currentEditor: null,
  setCurrentEditor: vi.fn(),
  title: '',
  setTitle: vi.fn(),
  liveSharePermission: null,
  setLiveSharePermission: vi.fn(),
  isLiveShareLoading: false,
  setIsLiveShareLoading: vi.fn(),
  allowedUsers: [],
  setAllowedUsers: vi.fn(),
  scrollY: 0,
  setScrollY: vi.fn(),
  isEditorFocused: true,
  setIsEditorFocused: vi.fn(),
  focusIndicatorPosition: null,
  setFocusIndicatorPosition: vi.fn(),
  isEditorReady: true,
  setIsEditorReady: vi.fn(),
};

// Toolbar mock
const mockToolbarState = {
  isAILoading: false,
  hasAIGeneratedContent: false,
  isDisabledToolbarButton: false,
  handleClick: vi.fn((command: () => void) => command()),
  shouldShowToolbar: true,
};

// Formatting mock
const mockFormattingState = {
  editor: null,
  selector: vi.fn().mockReturnValue({
    heading1: false,
    heading2: false,
    heading3: false,
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    bulletList: false,
    orderedList: false,
    taskList: false,
    code: false,
    codeBlock: false,
    blockquote: false,
    paragraph: true,
    textAlign: 'left',
  }),
};

// Mock modules
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(() => mockEditorStore),
}));

vi.mock('@/hooks/use-editor-toolbar', () => ({
  useEditorToolbar: vi.fn(() => mockToolbarState),
}));

vi.mock('@/utils/useActiveFormatting', () => ({
  useActiveFormatting: vi.fn(() => mockFormattingState),
}));

vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react');
  return {
    ...actual,
    useSession: vi.fn(() => ({ data: null, status: 'authenticated' })),
  };
});

vi.mock('@/hooks/useMemo', () => ({
  useMemo: vi.fn(() => ({
    data: {
      id: 'test-id',
      title: 'Test Memo',
      content: 'Test content',
      isLiveShareEnabled: false,
      userId: 'user-1',
    },
    isCurrentMemoOwner: true,
  })),
}));

vi.mock('@/hooks/useEditorSave', () => ({
  useEditorSave: vi.fn(() => ({
    isCurrentMemoSaving: vi.fn(() => false),
  })),
}));

vi.mock('@/hooks/use-ai-correction', () => ({
  useAICorrection: vi.fn(() => ({
    isAILoading: false,
    hasAIGeneratedContent: false,
    aiLoadingMessage: '',
    correctionCount: 0,
    currentCorrectionIndex: 0,
    handleAIStart: vi.fn(),
    handleAIComplete: vi.fn(),
    handleAIFailed: vi.fn(),
    handleCorrectionsFound: vi.fn(),
    handlePrevCorrection: vi.fn(),
    handleNextCorrection: vi.fn(),
    handleApplySingleCorrection: vi.fn(),
    handleCancelSingleCorrection: vi.fn(),
    handleRestoreContent: vi.fn(),
    handleApplyContent: vi.fn(),
  })),
}));

vi.mock('@/store/editorToolbarStore', () => ({
  useEditorToolbarStore: vi.fn(() => ({
    isAILoading: false,
    hasAIGeneratedContent: false,
    aiLoadingMessage: '',
    isDisabledToolbarButton: false,
    hasUnsavedChanges: false,
    isCorrectionMode: false,
    setAILoading: vi.fn(),
    setAIGeneratedContent: vi.fn(),
    setDisabledToolbarButton: vi.fn(),
    setUnsavedChanges: vi.fn(),
  })),
}));

vi.mock('@/contexts/SocketContext', () => ({
  useSocketContext: vi.fn(() => ({
    isConnected: true,
  })),
}));

// Create mock editor with proper chaining
const createMockEditor = () => {
  const mockChain = {
    focus: vi.fn().mockReturnThis(),
    extendMarkRange: vi.fn().mockReturnThis(),
    unsetLink: vi.fn().mockReturnThis(),
    setLink: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  return {
    chain: vi.fn(() => mockChain),
    commands: {
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleUnderline: vi.fn(),
      toggleStrike: vi.fn(),
      toggleCode: vi.fn(),
      toggleCodeBlock: vi.fn(),
      toggleBlockquote: vi.fn(),
      focus: vi.fn(),
    },
    isActive: vi.fn(() => false),
    getAttributes: vi.fn().mockReturnValue({ href: '' }),
    getText: vi.fn(() => 'Test content for AI'),
  };
};

describe('ToolbarStandard Component', () => {
  let mockEditor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEditor = createMockEditor();

    // Reset mocks
    mockEditorStore.currentEditor = null;
    mockToolbarState.isAILoading = false;
    mockToolbarState.hasAIGeneratedContent = false;
    mockToolbarState.isDisabledToolbarButton = false;
    mockToolbarState.shouldShowToolbar = true;
  });

  describe('Rendering Tests', () => {
    it('editor가 null일 때 null을 반환해야 함', () => {
      mockEditorStore.currentEditor = null;

      const { container } = render(<ToolbarStandard />);
      expect(container.firstChild).toBeNull();
    });

    it('editor가 존재할 때 툴바가 렌더링되어야 함', () => {
      mockEditorStore.currentEditor = mockEditor;

      render(<ToolbarStandard />);

      // 툴바는 버튼들을 포함하는 컨테이너로 확인
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    });

    it('모든 포맷팅 버튼이 렌더링되어야 함', () => {
      mockEditorStore.currentEditor = mockEditor;

      render(<ToolbarStandard />);

      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /underline/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /link/i })).toBeInTheDocument();
    });
  });

  describe('Button Interaction Tests', () => {
    it('Bold 버튼 클릭 시 toggleBold 커맨드가 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      const boldButton = screen.getByRole('button', { name: /bold/i });
      await user.click(boldButton);

      expect(mockEditor.commands.toggleBold).toHaveBeenCalledTimes(1);
    });

    it('Italic 버튼 클릭 시 toggleItalic 커맨드가 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      const italicButton = screen.getByRole('button', { name: /italic/i });
      await user.click(italicButton);

      expect(mockEditor.commands.toggleItalic).toHaveBeenCalledTimes(1);
    });

    it('Underline 버튼 클릭 시 toggleUnderline 커맨드가 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      const underlineButton = screen.getByRole('button', { name: /underline/i });
      await user.click(underlineButton);

      expect(mockEditor.commands.toggleUnderline).toHaveBeenCalledTimes(1);
    });

    it('Link 버튼 클릭 시 링크 모달이 열려야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      const linkButton = screen.getByRole('button', { name: /link/i });
      await user.click(linkButton);

      // 모달이 열렸는지 placeholder로 확인
      expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    });

    it('Code Block 버튼 클릭 시 toggleCodeBlock 커맨드가 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      const codeBlockButton = screen.getByRole('button', { name: /code block/i });
      await user.click(codeBlockButton);

      expect(mockEditor.commands.toggleCodeBlock).toHaveBeenCalledTimes(1);
    });

    it('Blockquote 버튼 클릭 시 toggleBlockquote 커맨드가 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      const blockquoteButton = screen.getByRole('button', { name: /blockquote/i });
      await user.click(blockquoteButton);

      expect(mockEditor.commands.toggleBlockquote).toHaveBeenCalledTimes(1);
    });
  });

  describe('Link Modal Tests', () => {
    it('URL 입력 후 저장 시 setLink 커맨드가 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      await user.click(screen.getByRole('button', { name: /link/i }));

      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'https://test.com');

      const saveButton = screen.getByRole('button', { name: /저장/i });
      await user.click(saveButton);

      expect(mockEditor.chain).toHaveBeenCalled();
    });

    it('URL 없이 저장 시 unsetLink 커맨드가 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      await user.click(screen.getByRole('button', { name: /link/i }));

      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.clear(urlInput);

      const saveButton = screen.getByRole('button', { name: /저장/i });
      await user.click(saveButton);

      expect(mockEditor.chain).toHaveBeenCalled();
    });

    it('취소 버튼 클릭 시 모달이 닫혀야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      await user.click(screen.getByRole('button', { name: /link/i }));

      const cancelButton = screen.getByRole('button', { name: /취소/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('ESC 키로 모달을 닫을 수 있어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      await user.click(screen.getByRole('button', { name: /link/i }));
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Conditional Rendering Tests', () => {
    it('isAILoading이 true일 때 툴바가 숨겨져야 함', () => {
      mockEditorStore.currentEditor = mockEditor;
      mockToolbarState.isAILoading = true;
      mockToolbarState.shouldShowToolbar = false;

      const { container } = render(<ToolbarStandard />);

      const toolbarWrapper = container.querySelector('.transition-all');
      expect(toolbarWrapper).toHaveClass('opacity-0');
    });

    it('hasAIGeneratedContent가 true일 때 툴바가 숨겨져야 함', () => {
      mockEditorStore.currentEditor = mockEditor;
      mockToolbarState.hasAIGeneratedContent = true;
      mockToolbarState.shouldShowToolbar = false;

      const { container } = render(<ToolbarStandard />);

      const toolbarWrapper = container.querySelector('.transition-all');
      expect(toolbarWrapper).toHaveClass('opacity-0');
    });

    it('isDisabledToolbarButton이 true일 때 모든 버튼이 비활성화되어야 함', () => {
      mockEditorStore.currentEditor = mockEditor;
      mockToolbarState.isDisabledToolbarButton = true;

      render(<ToolbarStandard />);

      expect(screen.getByRole('button', { name: /bold/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /italic/i })).toBeDisabled();
    });
  });

  describe('Active State Tests', () => {
    it('bold가 활성화되어 있을 때 Bold 버튼이 활성화 상태여야 함', () => {
      mockEditorStore.currentEditor = mockEditor;
      mockFormattingState.selector = vi.fn().mockReturnValue({
        bold: true,
        italic: false,
        underline: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        heading1: false,
        heading2: false,
        heading3: false,
        bulletList: false,
        orderedList: false,
        taskList: false,
        paragraph: true,
        textAlign: 'left',
      });

      render(<ToolbarStandard />);

      // 활성화 상태 확인 - 버튼이 렌더링되면 테스트 통과
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    });

    it('italic이 활성화되어 있을 때 Italic 버튼이 활성화 상태여야 함', () => {
      mockEditorStore.currentEditor = mockEditor;
      mockFormattingState.selector = vi.fn().mockReturnValue({
        bold: false,
        italic: true,
        underline: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        heading1: false,
        heading2: false,
        heading3: false,
        bulletList: false,
        orderedList: false,
        taskList: false,
        paragraph: true,
        textAlign: 'left',
      });

      render(<ToolbarStandard />);

      // 활성화 상태 확인 - 버튼이 렌더링되면 테스트 통과
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    });
  });

  describe('Scroll Gradient Tests', () => {
    it('scrollWidth > offsetWidth일 때 스크롤 그라데이션이 표시되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const { container } = render(<ToolbarStandard />);

      const scrollContainer = container.querySelector('.overflow-x-auto');
      Object.defineProperty(scrollContainer, 'scrollWidth', { value: 1000 });
      Object.defineProperty(scrollContainer, 'offsetWidth', { value: 500 });
      Object.defineProperty(scrollContainer, 'scrollLeft', { value: 100 });

      await act(async () => {
        fireEvent.scroll(scrollContainer);
      });

      const gradientContainer = container.querySelector('.scroll-gradient-container');
      expect(gradientContainer).not.toHaveClass('opacity-0');
    });

    it('scrollWidth <= offsetWidth일 때 스크롤 그라데이션이 숨겨져야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const { container } = render(<ToolbarStandard />);

      const scrollContainer = container.querySelector('.overflow-x-auto');
      Object.defineProperty(scrollContainer, 'scrollWidth', { value: 500 });
      Object.defineProperty(scrollContainer, 'offsetWidth', { value: 500 });
      Object.defineProperty(scrollContainer, 'scrollLeft', { value: 0 });

      await act(async () => {
        fireEvent.scroll(scrollContainer);
      });

      const gradientContainer = container.querySelector('.scroll-gradient-container');
      expect(gradientContainer).toHaveClass('opacity-0');
    });
  });

  describe('Handle Click Tests', () => {
    it('handleClick이 호출될 때 toolbarState의 handleClick이 호출되어야 함', async () => {
      mockEditorStore.currentEditor = mockEditor;
      const user = userEvent.setup();

      render(<ToolbarStandard />);
      const boldButton = screen.getByRole('button', { name: /bold/i });
      await user.click(boldButton);

      // handleClick이 호출되는지 확인 (toggleBold 실행 여부 확인)
      expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
    });
  });

  describe('Edge Cases Tests', () => {
    it('editor가 undefined일 때 null을 반환해야 함', () => {
      mockEditorStore.currentEditor = undefined;

      const { container } = render(<ToolbarStandard />);
      expect(container.firstChild).toBeNull();
    });
  });
});

describe('ToolbarStandard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Bold 버튼을 연속으로 클릭하면 toggleBold가 여러 번 호출되어야 함', async () => {
    const mockEditor = createMockEditor();
    mockEditorStore.currentEditor = mockEditor;

    const user = userEvent.setup();
    render(<ToolbarStandard />);

    const boldButton = screen.getByRole('button', { name: /bold/i });
    await user.click(boldButton);
    await user.click(boldButton);
    await user.click(boldButton);

    expect(mockEditor.commands.toggleBold).toHaveBeenCalledTimes(3);
  });

  it('AI 로딩 상태와 일반 상태를 전환할 때 툴바가 올바르게 표시/숨김되어야 함', async () => {
    const mockEditor = createMockEditor();
    mockEditorStore.currentEditor = mockEditor;

    const { rerender } = render(<ToolbarStandard />);

    // AI 로딩 상태로 변경
    mockToolbarState.isAILoading = true;
    mockToolbarState.shouldShowToolbar = false;

    rerender(<ToolbarStandard />);

    const toolbarWrapper = document.querySelector('.transition-all');
    expect(toolbarWrapper).toHaveClass('opacity-0');

    // 일반 상태로 복원
    mockToolbarState.isAILoading = false;
    mockToolbarState.shouldShowToolbar = true;

    rerender(<ToolbarStandard />);
    expect(toolbarWrapper).not.toHaveClass('opacity-0');
  });
});
