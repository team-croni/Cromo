import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Slice, Fragment } from '@tiptap/pm/model';
import { isMarkdown } from './markdown';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 텍스트 노드 생성 헬퍼 함수
const createTextNode = (schema: any, text: string, marks: any[] = []) => {
  return schema.text(text, marks);
};

// 마크 적용 텍스트 생성 함수
const createMarkedText = (schema: any, text: string, markType: string, attrs: any = {}) => {
  const marks = [schema.marks[markType].create(attrs)];
  return createTextNode(schema, text, marks);
};

// 자식 요소 처리 함수
const processChildren = (element: Element, processElement: (el: Element) => any[], schema: any, currentMarks: any[] = []) => {
  const content: any[] = [];

  element.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      content.push(createTextNode(schema, child.textContent || '', currentMarks));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childNodes = processElement(child as Element);
      childNodes.forEach(node => {
        if (node.isText && node.marks) {
          content.push(createTextNode(schema, node.text, [...node.marks, ...currentMarks]));
        } else if (node.isText) {
          content.push(createTextNode(schema, node.text, currentMarks));
        } else {
          content.push(node);
        }
      });
    }
  });

  return content;
};

// 마크다운을 감지하고 파싱하는 Tiptap 확장
export const MarkdownPasteHandler = Extension.create({
  name: 'markdownPasteHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event, slice) => {
            const text = event.clipboardData?.getData('text/plain');
            if (!text) {
              return false;
            }

            // 마크다운 형식인지 확인
            if (isMarkdown(text)) {
              console.log('##### markdown')
              event.preventDefault();

              // 줄바꿈 두 개를 세 개로 변경
              const modifiedText = text.replace(/\n\n/g, '\n<p></p>\n\n');

              // 마크다운을 HTML로 변환
              try {
                let html = DOMPurify.sanitize(marked.parse(modifiedText) as string);

                // 코드 블록 내부를 제외하고 줄바꿈 제거
                html = html.replace(/(<pre[^>]*>[\s\S]*?<\/pre>)|(\n)/g, (match, codeBlock) => {
                  // 코드 블록인 경우 원본 유지
                  if (codeBlock) {
                    return codeBlock;
                  }
                  // 일반 줄바꿈은 제거
                  return '';
                });
                console.log(html)

                // 커서 위치에 HTML 삽입
                const { state, dispatch } = view;

                // HTML 문자열을 DOMParser로 파싱
                const domParser = new DOMParser();
                const doc = domParser.parseFromString(html, 'text/html');

                // DOM 노드들을 ProseMirror 노드로 변환
                const nodes = [];

                const processElement = (element: Element): any[] => {
                  const elementNodes = [];
                  const schema = view.state.schema;

                  console.log(element)

                  // BR 태그 처리
                  if (element.tagName === 'BR') {
                    elementNodes.push(schema.nodes.hardBreak.create());
                  }

                  // 헤딩 요소 처리 (h1-h6)
                  else if (element.tagName.match(/^H[1-6]$/)) {
                    const level = parseInt(element.tagName[1]);
                    elementNodes.push(schema.nodes.heading.create({ level }, createTextNode(schema, element.textContent || '')));
                  }

                  // 굵게 처리 (strong, b)
                  else if (element.tagName === 'STRONG' || element.tagName === 'B') {
                    if (element.childNodes.length > 0) {
                      const content = processChildren(element, processElement, schema, [schema.marks.bold.create()]);
                      elementNodes.push(...content);
                    } else {
                      elementNodes.push(createMarkedText(schema, element.textContent || '', 'bold'));
                    }
                  }

                  // 이탤릭 처리 (em, i)
                  else if (element.tagName === 'EM' || element.tagName === 'I') {
                    if (element.childNodes.length > 0) {
                      const content = processChildren(element, processElement, schema, [schema.marks.italic.create()]);
                      elementNodes.push(...content);
                    } else {
                      elementNodes.push(createMarkedText(schema, element.textContent || '', 'italic'));
                    }
                  }

                  // 링크 처리 (a)
                  else if (element.tagName === 'A') {
                    const href = element.getAttribute('href') || '';
                    if (element.childNodes.length > 0) {
                      const content = processChildren(element, processElement, schema, [schema.marks.link.create({ href })]);
                      elementNodes.push(...content);
                    } else {
                      elementNodes.push(createMarkedText(schema, element.textContent || '', 'link', { href }));
                    }
                  }

                  // 코드 처리 (code)
                  else if (element.tagName === 'CODE') {
                    if (element.childNodes.length > 0) {
                      const content = processChildren(element, processElement, schema, [schema.marks.code.create()]);
                      elementNodes.push(...content);
                    } else {
                      elementNodes.push(createMarkedText(schema, element.textContent || '', 'code'));
                    }
                  }

                  // 코드 블록 처리 (pre > code)
                  else if (element.tagName === 'PRE' && element.children.length === 1 && element.children[0].tagName === 'CODE') {
                    const codeElement = element.children[0];
                    let codeText = codeElement.textContent || '';
                    // 마지막 줄바꿈 제거
                    if (codeText.endsWith('\n')) {
                      codeText = codeText.slice(0, -1);
                    }
                    elementNodes.push(schema.nodes.codeBlock.create({}, createTextNode(schema, codeText)));
                  }

                  // 리스트 요소 처리 (ul, ol, li)
                  else if (element.tagName === 'UL' || element.tagName === 'OL') {
                    // 리스트 아이템들 처리
                    const listItems = Array.from(element.children)
                      .filter(child => child.tagName === 'LI')
                      .map(li => {
                        // 리스트 아이템 내부의 모든 자식 요소 처리
                        const liContent: any[] = [];
                        for (const liChild of Array.from(li.childNodes)) {
                          if (liChild.nodeType === Node.TEXT_NODE) {
                            if (liChild.textContent?.trim()) {
                              liContent.push(createTextNode(schema, liChild.textContent));
                            }
                          } else if (liChild.nodeType === Node.ELEMENT_NODE) {
                            const processed = processElement(liChild as Element);
                            processed.forEach(node => {
                              // 불필요한 빈 p 태그 제거 (li > p:has(br.ProseMirror-trailingBreak)에 해당하는 경우)
                              if (node.type && node.type.name === 'paragraph') {
                                // paragraph 노드가 비어있거나, 단일 hardBreak만 포함하고 있는 경우 제거
                                if (node.content && node.content.childCount > 0) {
                                  let isEmptyParagraph = false;

                                  // 자식 노드가 하나이고 그게 hardBreak인 경우
                                  if (node.content.childCount === 1) {
                                    const childNode = node.content.child(0);
                                    if (childNode.type.name === 'hardBreak') {
                                      isEmptyParagraph = true;
                                    }
                                  }

                                  // 비어 있지 않은 경우에만 추가
                                  if (!isEmptyParagraph) {
                                    // paragraph 노드의 내용만 추출
                                    if (node.content && node.content.childCount > 0) {
                                      for (let i = 0; i < node.content.childCount; i++) {
                                        liContent.push(node.content.child(i));
                                      }
                                    }
                                  }
                                }
                              } else {
                                liContent.push(node);
                              }
                            });
                          }
                        }

                        return schema.nodes.listItem.create({}, liContent);
                      });

                    // 정렬되지 않은 리스트
                    if (element.tagName === 'UL') {
                      elementNodes.push(schema.nodes.bulletList.create({}, listItems));
                    }
                    // 정렬된 리스트
                    else {
                      elementNodes.push(schema.nodes.orderedList.create({}, listItems));
                    }
                  }

                  // 블록 인용문 처리 (blockquote)
                  else if (element.tagName === 'BLOCKQUOTE') {
                    const blockquoteContent: any[] = [];
                    for (const child of Array.from(element.childNodes)) {
                      if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent?.trim()) {
                          blockquoteContent.push(schema.nodes.paragraph.create({}, [createTextNode(schema, child.textContent)]));
                        }
                      } else if (child.nodeType === Node.ELEMENT_NODE) {
                        blockquoteContent.push(...processElement(child as Element));
                      }
                    }
                    elementNodes.push(schema.nodes.blockquote.create({}, blockquoteContent));
                  }

                  // 수평선 처리 (hr)
                  else if (element.tagName === 'HR') {
                    elementNodes.push(schema.nodes.horizontalRule.create());
                  }

                  // 기타 블록 요소 (div, p 등)
                  else if (element.tagName === 'P') {
                    const pContent: any[] = [];
                    for (const child of Array.from(element.childNodes)) {
                      if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent?.trim()) {
                          pContent.push(createTextNode(schema, child.textContent));
                        }
                      } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const processed = processElement(child as Element);
                        processed.forEach(node => {
                          if (node.isText) {
                            pContent.push(createTextNode(schema, node.text, node.marks || []));
                          } else {
                            pContent.push(node);
                          }
                        });
                      }
                    }
                    elementNodes.push(schema.nodes.paragraph.create({}, pContent));
                  }

                  // 기타 요소는 기본 텍스트로 처리
                  else {
                    if (element.childNodes.length > 0) {
                      const content: any[] = [];
                      element.childNodes.forEach(child => {
                        if (child.nodeType === Node.TEXT_NODE) {
                          if (child.textContent?.trim()) {
                            content.push(createTextNode(schema, child.textContent));
                          }
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                          content.push(...processElement(child as Element));
                        }
                      });
                      if (content.length > 0) {
                        elementNodes.push(schema.nodes.paragraph.create({}, content));
                      }
                    } else {
                      const textContent = element.textContent || '';
                      if (textContent.trim()) {
                        elementNodes.push(schema.nodes.paragraph.create({}, [createTextNode(schema, textContent)]));
                      }
                    }
                  }

                  return elementNodes;
                };

                for (const child of Array.from(doc.body.childNodes)) {
                  if (child.nodeType === Node.TEXT_NODE) {
                    if (child.textContent?.trim()) {
                      nodes.push(view.state.schema.nodes.paragraph.create({}, [createTextNode(view.state.schema, child.textContent)]));
                    }
                  } else if (child.nodeType === Node.ELEMENT_NODE) {
                    nodes.push(...processElement(child as Element));
                  }
                }

                // 프래그먼트 생성 및 삽입
                if (nodes.length > 0) {
                  const fragment = Fragment.from(nodes);
                  const slice = new Slice(fragment, 0, 0);
                  dispatch(state.tr.replaceSelection(slice).scrollIntoView());
                  return true;
                }
              } catch (error) {
                console.error('Error parsing markdown:', error);
                return false;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});