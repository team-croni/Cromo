import Heading from '@tiptap/extension-heading';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import { Extension, Node } from '@tiptap/core';
import { MarkdownPasteHandler } from './markdownPasteHandler';
import { Focus, Placeholder } from "@tiptap/extensions";
import { Plugin } from 'prosemirror-state';
import StarterKit from "@tiptap/starter-kit";
import { mergeAttributes } from '@tiptap/core';

// lowlight 인스턴스 생성 및 언어 등록
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('java', java);
lowlight.register('html', html);
lowlight.register('css', css);

// 탭 키 처리를 위한 확장
const TabExtension = Extension.create({
  name: 'tabHandler',

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from, $to } = selection;

        // 현재 선택된 노드 가져오기
        const currentNode = $from.node();
        const parentNode = $from.parent;

        // 직접 부모 노드가 리스트 항목인지 확인
        if ((currentNode && currentNode.type.name === 'listItem') ||
          (parentNode && parentNode.type.name === 'listItem')) {
          // 탭 키의 기본 동작 방지
          if (typeof window !== 'undefined' && window.event) {
            window.event.preventDefault();
          }
          return this.editor.commands.sinkListItem('listItem');
        }

        // 일반 텍스트에서 탭 문자 삽입
        const { from, to } = this.editor.state.selection;
        if (from === to) {
          // 탭 키의 기본 동작 방지
          if (typeof window !== 'undefined' && window.event) {
            window.event.preventDefault();
          }
          this.editor.commands.insertContent('\t');
          return true;
        }

        return false;
      },
      'Shift-Tab': () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from, $to } = selection;

        // 현재 선택된 노드 가져오기
        const currentNode = $from.node();
        const parentNode = $from.parent;

        // 직접 부모 노드가 리스트 항목인지 확인
        if ((currentNode && currentNode.type.name === 'listItem') ||
          (parentNode && parentNode.type.name === 'listItem')) {
          // Shift+Tab 키의 기본 동작 방지
          if (typeof window !== 'undefined' && window.event) {
            window.event.preventDefault();
          }
          return this.editor.commands.liftListItem('listItem');
        }

        // 일반 텍스트에서 탭 문자 제거
        const { from, to } = this.editor.state.selection;
        if (from === to) {
          const $pos = this.editor.state.doc.resolve(from);
          const lineStart = $pos.start($pos.depth);
          const lineContent = this.editor.state.doc.textBetween(lineStart, from);
          if (lineContent.endsWith('\t')) {
            // Shift+Tab 키의 기본 동작 방지
            if (typeof window !== 'undefined' && window.event) {
              window.event.preventDefault();
            }
            this.editor.commands.deleteRange({ from: from - 1, to: from });
            return true;
          }
        }

        return false;
      },
    };
  },
});

/**
 * AI 오타 수정을 위한 커스텀 노드들
 * delete와 insert를 별도의 노드로 분리
 */

// AI 오타 텍스트를 위한 커스텀 노드 (삭제될 텍스트)
const AIDeleteNode = Node.create({
  name: 'aiDelete',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: {
        default: '',
      },
      insert: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-ai-delete]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          return {
            text: element.getAttribute('data-text') || '',
            insert: element.getAttribute('data-insert') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { text, insert } = HTMLAttributes;

    return [
      'span',
      {
        'data-ai-delete': 'true',
        'data-text': text,
        'data-insert': insert,
        class: 'ai-delete'
      },
      text
    ];
  },

});

// AI 교정값을 위한 커스텀 노드 (올바른 텍스트)
const AIInsertNode = Node.create({
  name: 'aiInsert',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: {
        default: '',
      },
      isActive: {
        default: false,
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { selection } = this.editor.state;
        const { empty, $from } = selection;

        if (empty) {
          // 커서가 노드 바로 뒤에 있는 경우
          const nodeBefore = $from.nodeBefore;
          if (nodeBefore && (nodeBefore.type.name === 'aiInsert' || nodeBefore.type.name === 'aiDelete')) {
            return true; // 삭제 방지
          }
        } else {
          // 범위 선택인 경우
          let hasAINode = false;
          this.editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
            if (node.type.name === 'aiInsert' || node.type.name === 'aiDelete') {
              hasAINode = true;
              return false;
            }
          });
          if (hasAINode) return true;
        }
        return false;
      },
      Delete: () => {
        const { selection } = this.editor.state;
        const { empty, $from } = selection;

        if (empty) {
          // 커서가 노드 바로 앞에 있는 경우
          const nodeAfter = $from.nodeAfter;
          if (nodeAfter && (nodeAfter.type.name === 'aiInsert' || nodeAfter.type.name === 'aiDelete')) {
            return true; // 삭제 방지
          }
        } else {
          // 범위 선택인 경우
          let hasAINode = false;
          this.editor.state.doc.nodesBetween(selection.from, selection.to, (node) => {
            if (node.type.name === 'aiInsert' || node.type.name === 'aiDelete') {
              hasAINode = true;
              return false;
            }
          });
          if (hasAINode) return true;
        }
        return false;
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-ai-insert]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          return {
            text: element.getAttribute('data-text') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { text, isActive } = HTMLAttributes;

    return [
      'span',
      {
        'data-ai-insert': 'true',
        'data-text': text,
        'data-is-active': isActive ? 'true' : 'false',
        class: `ai-insert ${isActive ? 'ring-1 ring-secondary rounded-sm' : ''}`,
        style: isActive ? 'transition: all 0.2s ease-in-out;' : ''
      },
      text
    ];
  },

});

// 메모 참조 블록 노드
const MemoLinkBlockNode = Node.create({
  name: 'memoLinkBlock',

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      memoId: {
        default: '',
      },
      memoTitle: {
        default: '',
      },
      currentFolderId: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-memo-link-block]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          return {
            memoId: element.getAttribute('data-memo-id') || '',
            memoTitle: element.getAttribute('data-memo-title') || '',
            currentFolderId: element.getAttribute('data-current-folder-id') || null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { memoId, memoTitle, currentFolderId } = HTMLAttributes;

    return [
      'div',
      {
        'data-memo-link-block': 'true',
        'data-memo-id': memoId,
        'data-memo-title': memoTitle,
        'data-current-folder-id': currentFolderId,
        class: 'memo-link-block',
      },
      [
        'div',
        { class: 'memo-link-block-content' },
        [
          'span',
          { class: 'memo-link-block-title' },
          memoTitle || '제목 없음'
        ],
        [
          'div',
          { class: 'memo-link-block-arrow-container' },
          [
            'span',
            { class: 'memo-link-block-arrow' },
            '메모로 이동'
          ],
          [
            'div',
            { class: 'memo-link-block-icon' },
            [
              'svg',
              {
                width: '14',
                height: '14',
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
              },
              [
                'path',
                { d: 'M5 12h14' }
              ],
              [
                'path',
                { d: 'm12 5 7 7-7 7' }
              ]
            ]
          ]
        ]
      ]
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'memo-link-block';
      dom.setAttribute('data-memo-link-block', 'true');
      dom.setAttribute('data-memo-id', node.attrs.memoId);
      dom.setAttribute('data-memo-title', node.attrs.memoTitle);
      dom.setAttribute('data-current-folder-id', node.attrs.currentFolderId);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'memo-link-block-content';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'memo-link-block-title';
      titleSpan.textContent = node.attrs.memoTitle || '제목 없음';

      const arrowContainer = document.createElement('div');
      arrowContainer.className = 'memo-link-block-arrow-container';

      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'memo-link-block-arrow';
      arrowSpan.textContent = '메모로 이동';

      // Lucide ArrowRight 아이콘 추가
      const iconContainer = document.createElement('div');
      iconContainer.className = 'memo-link-block-icon';
      iconContainer.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';

      arrowContainer.appendChild(arrowSpan);
      arrowContainer.appendChild(iconContainer);

      contentDiv.appendChild(titleSpan);
      contentDiv.appendChild(arrowContainer);
      dom.appendChild(contentDiv);

      dom.addEventListener('click', () => {
        // 메모 이동 이벤트 발생
        const event = new CustomEvent('memoLinkClick', {
          detail: {
            memoId: node.attrs.memoId,
            currentFolderId: node.attrs.currentFolderId,
          },
        });
        window.dispatchEvent(event);
      });

      return {
        dom,
      };
    };
  },
});

// 드래그 앤 드랍 extension
const DragDropExtension = Extension.create({
  name: 'dragDropHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            drop: (view, event) => {
              // 드래그 데이터 확인
              const dragData = event.dataTransfer?.getData('application/cromo-memo');
              if (!dragData) return false;

              try {
                const parsedData = JSON.parse(dragData);
                if (!parsedData.type || parsedData.type !== 'memo') return false;

                // 드롭된 좌표로부터 ProseMirror 위치 계산
                const coords = {
                  left: event.clientX,
                  top: event.clientY,
                };
                const pos = view.posAtCoords(coords);
                if (!pos) return false;

                const { pos: dropPos } = pos;
                const $dropPos = view.state.doc.resolve(dropPos);

                // 가장 가까운 단락 노드 찾기
                let paragraphNode = null;
                let paragraphStart = 0;
                let paragraphEnd = 0;

                for (let i = $dropPos.depth; i >= 0; i--) {
                  const node = $dropPos.node(i);
                  if (node.type.name === 'paragraph') {
                    paragraphNode = node;
                    paragraphStart = $dropPos.start(i);
                    paragraphEnd = $dropPos.end(i);
                    break;
                  }
                }

                // 메모 링크 블록 노드 생성
                const memoNode = view.state.schema.nodes.memoLinkBlock.create({
                  memoId: parsedData.memoId,
                  memoTitle: parsedData.title || '제목 없음',
                  currentFolderId: parsedData.currentFolderId,
                });

                // 이벤트를 소비하여 기본 동작 방지
                event.preventDefault();

                let tr = view.state.tr;

                // 빈 단락에 드랍한 경우 단락을 교체
                if (paragraphNode && paragraphNode.textContent.trim() === '') {
                  tr = tr.replaceRangeWith(paragraphStart, paragraphEnd, memoNode);
                } else {
                  // 다른 곳에 드랍한 경우는 일반 삽입
                  tr = tr.insert(dropPos, memoNode);
                }

                view.dispatch(tr);

                return true;
              } catch (error) {
                console.error('메모 드래그 앤 드랍 처리 중 오류:', error);
                return false;
              }
            },
          },
        },
      }),
    ];
  },
});

// 코드 블록에 복사 버튼을 추가하는 확장
const CopyButtonCodeBlock = CodeBlockLowlight.extend({
  name: 'codeBlock',

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('code-block-wrapper');

      // 원래의 코드 블록을 렌더링
      const dom = document.createElement('pre');
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value !== undefined) {
          dom.setAttribute(key, value);
        }
      });

      const code = document.createElement('code');
      if (node.content.firstChild) {
        code.textContent = node.content.firstChild.textContent;
      }
      dom.appendChild(code);
      wrapper.appendChild(dom);

      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('copy-code-button');
      button.textContent = '복사';

      button.addEventListener('click', () => {
        const textToCopy = code.textContent || '';
        navigator.clipboard.writeText(textToCopy).then(() => {
          // 복사 성공 시 피드백
          button.textContent = '복사됨!';
          setTimeout(() => {
            button.textContent = '복사';
          }, 2000);
        }).catch(err => {
          console.error('복사 실패:', err);
        });
      });

      wrapper.appendChild(button);

      return {
        dom: wrapper,
        contentDOM: code, // 하이라이팅을 위해 contentDOM 지정
      };
    };
  },
});

export const getEditorExtensions = () => [
  Underline,
  Heading.configure({
    levels: [1, 2, 3],
  }),
  CopyButtonCodeBlock.configure({
    lowlight,
  }),
  StarterKit.configure({
    heading: false, // Disabling mostly to use the custom configuration above
    codeBlock: false, // Disabling to use CodeBlockLowlight
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Placeholder.configure({
    placeholder: "",
  }),
  Focus.configure({
    className: 'has-focus',
  }),
  TabExtension,
  MarkdownPasteHandler,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  // Blockquote, // Included in StarterKit

  AIDeleteNode, // AI 오타 삭제 텍스트 커스텀 노드 추가
  AIInsertNode, // AI 오타 교정값 커스텀 노드 추가
  MemoLinkBlockNode, // 메모 링크 블록 노드 추가
  DragDropExtension, // 드래그 앤 드랍 익스텐션 추가
];

/**
 * TiTap Editor용 AI 오타 수정 유틸리티
 * 커스텀 노드를 사용한 시각적 표시
 */

// RegExp 이스케이프 함수
export const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// HTML 태그를 무시하고 텍스트 기반으로 일치하는 위치를 찾는 함수
export const findTextPositionInHtml = (html: string, searchText: string): Array<{ start: number, end: number }> => {
  if (!searchText) return [];

  // HTML 태그를 제거한 순수 텍스트
  const plainText = html.replace(/<[^>]*>/g, '');

  const positions: Array<{ start: number, end: number }> = [];
  let searchStart = 0;

  while (searchStart <= plainText.length - searchText.length) {
    const index = plainText.indexOf(searchText, searchStart);
    if (index === -1) break;

    // HTML 내의 실제 위치 계산
    const htmlStart = convertTextIndexToHtmlIndex(html, index);
    const htmlEnd = convertTextIndexToHtmlIndex(html, index + searchText.length);

    if (htmlStart !== -1 && htmlEnd !== -1) {
      positions.push({ start: htmlStart, end: htmlEnd });
    }

    searchStart = index + 1;
  }

  return positions;
};

// 텍스트 인덱스를 HTML 내의 실제 인덱스로 변환하는 함수
const convertTextIndexToHtmlIndex = (html: string, textIndex: number): number => {
  if (textIndex < 0) return -1;

  let htmlIndex = 0;
  let currentIndex = 0;

  while (currentIndex < textIndex && htmlIndex < html.length) {
    if (html[htmlIndex] === '<') {
      // 태그 건너뛰기
      while (htmlIndex < html.length && html[htmlIndex] !== '>') {
        htmlIndex++;
      }
      htmlIndex++;
    } else {
      // 텍스트 문자이므로 인덱스 증가
      htmlIndex++;
      currentIndex++;
    }
  }

  return htmlIndex;
};

// HTML 내에서 텍스트를 교체하는 함수
export const replaceTextInHtml = (html: string, searchText: string, replacementHtml: string): string => {
  if (!searchText) return html;

  const positions = findTextPositionInHtml(html, searchText);

  // 뒤에서부터 처리하여 인덱스가 변경되는 문제 방지
  let result = html;
  for (let i = positions.length - 1; i >= 0; i--) {
    const { start, end } = positions[i];
    if (start !== -1 && end !== -1) {
      const before = result.substring(0, start);
      const after = result.substring(end);
      result = before + replacementHtml + after;
    }
  }

  return result;
};

/**
 * 에디터의 AI 노드들을 필터링하여 저장용 HTML을 반환
 * AI 오타 수정으로 인한 노드들을 자동 저장에서 무시
 */
// 에디터의 AI 노드들을 필터링하여 저장용 HTML을 반환 (원본 복원용)
export const getCleanHTMLForSave = (editor: any): string => {
  try {
    // 에디터의 전체 HTML 가져오기
    const html = editor.getHTML();

    // AI 노드들을 제외한 깔끔한 HTML 반환 (메모 링크 블록은 유지)
    const cleanHtml = html
      // 1. aiDelete 노드 처리:
      .replace(/<span[^>]*data-ai-delete="true"[^>]*data-text="([^"]*)"[^>]*data-insert="[^"]*"[^>]*>.*?<\/span>/g, '$1')

      // 2. aiInsert 노드 처리:
      .replace(/<span[^>]*data-ai-insert="true"[^>]*data-text="([^"]*)"[^>]*>.*?<\/span>/g, '')
      .trim();

    // 결과가 비어있으면 기본값 반환
    return cleanHtml || '<p></p>';
  } catch (error) {
    console.error('AI 노드 필터링 중 오류:', error);
    // 오류 시 기본 HTML 반환
    return editor.getHTML();
  }
};

/**
 * 에디터의 AI 노드들을 적용하여 HTML을 반환 (수정 사항 적용)
 * aiDelete 제거, aiInsert 유지
 */
export const getAppliedHTML = (editor: any): string => {
  try {
    const html = editor.getHTML();

    const appliedHtml = html
      // 1. aiDelete 노드 제거 (완전히 삭제)
      .replace(/<span[^>]*data-ai-delete="true"[^>]*>.*?<\/span>/g, '')

      // 2. aiInsert 노드 처리 (텍스트만 남김)
      // data-text 속성을 사용하여 텍스트 추출 (inner text보다 안전)
      .replace(/<span[^>]*data-ai-insert="true"[^>]*data-text="([^"]*)"[^>]*>.*?<\/span>/g, '$1')
      .trim();

    return appliedHtml || '<p></p>';
  } catch (error) {
    console.error('AI 노드 적용 중 오류:', error);
    return editor.getHTML();
  }
};

// 에디터에 AI 오타 수정 기능을 적용하는 유틸리티 함수
export const applyAICorrectionsToEditor = (editor: any, corrections: Array<{ delete: string, insert: string }>) => {
  try {
    // 현재 에디터의 content 가져오기
    const content = editor.getHTML();

    // HTML이 유효한지 확인
    if (!content || typeof content !== 'string') {
      console.error('에디터에서 유효한 HTML을 가져올 수 없습니다.');
      return;
    }

    // 빈 HTML이나 기본 구조가 아닌 경우 처리
    if (content.trim() === '' || content.trim() === '<p></p>' || content.trim() === '<p></p>\n') {
      console.warn('에디터에 내용이 없습니다.');
      return;
    }

    let modifiedContent = content;

    // 각 수정 사항을 순서대로 적용 (가장 긴 텍스트부터 처리하여 중복 방지)
    const sortedCorrections = corrections
      .filter(item => item.delete.trim().length > 0)
      .sort((a, b) => b.delete.length - a.delete.length);

    sortedCorrections.forEach((correction, index) => {
      const deleteText = correction.delete;
      const insertText = correction.insert;

      // 커스텀 노드들을 사용한 HTML 생성 (delete와 insert를 별도 노드로 분리)
      const correctionHtml = `<span data-ai-delete="true" data-text="${deleteText}" data-insert="${insertText}">${deleteText}</span><span data-ai-insert="true" data-text="${insertText}">${insertText}</span>`;

      // HTML 태그를 고려하여 텍스트를 찾아서 교체
      modifiedContent = replaceTextInHtml(modifiedContent, deleteText, correctionHtml);
    });

    // 수정된 HTML을 에디터에 적용
    editor.commands.setContent(modifiedContent);

  } catch (error) {
    console.error('수정 사항 적용 오류:', error);
    alert('수정 사항을 적용하는 중 오류가 발생했습니다.');
  }
};
