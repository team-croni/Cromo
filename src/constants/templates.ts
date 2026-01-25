import { MemoTemplate } from '@/types';

export const MEMO_TEMPLATES: MemoTemplate[] = [
  {
    id: 'blank',
    name: '빈 메모',
    title: '새로운 메모',
    content: ''
  },
  {
    id: 'meeting',
    name: '회의록',
    title: '회의록',
    content: `<h1>회의록</h1>
<p></p>
<h2>📅 회의 정보</h2>
<ul>
  <li><strong>일시:</strong> </li>
  <li><strong>장소:</strong> </li>
  <li><strong>참석자:</strong> </li>
</ul>

<h2>📋 주요议题</h2>
<ul>
  <li></li>
</ul>

<h2>✅ 결론 및 결정사항</h2>
<ul>
  <li></li>
</ul>

<h2>📝 다음 단계</h2>
<ul>
  <li><strong>담당자:</strong> </li>
  <li><strong>기한:</strong> </li>
  <li><strong>작업내용:</strong> </li>
</ul>`
  },
  {
    id: 'todo',
    name: '할 일 목록',
    title: '할 일 목록',
    content: `<h1>할 일 목록</h1>
<p></p>
<h2>📌 우선</h2>
<ul>
  <li>[ ] </li>
</ul>

<h2>📋 일반</h2>
<ul>
  <li>[ ] </li>
</ul>

<h2>✅ 완료</h2>
<ul>
  <li>[x] </li>
</ul>`
  },
  {
    id: 'note',
    name: '노트',
    title: '노트',
    content: `<h1>노트</h1>
<p></p>
<h2>🔍 요약</h2>
<p></p>

<h2>📖 상세 내용</h2>
<p></p>

<h2>💡 핵심 포인트</h2>
<ul>
  <li></li>
</ul>

<h2>📎 관련 자료</h2>
<ul>
  <li></li>
</ul>`
  },
  {
    id: 'project',
    name: '프로젝트 계획',
    title: '프로젝트 계획',
    content: `<h1>프로젝트 계획</h1>
<p></p>
<h2>🎯 프로젝트 개요</h2>
<ul>
  <li><strong>프로젝트명:</strong> </li>
  <li><strong>목표:</strong> </li>
  <li><strong>기간:</strong> </li>
</ul>

<h2>👥 팀 구성</h2>
<ul>
  <li><strong>팀장:</strong> </li>
  <li><strong>팀원:</strong> </li>
</ul>

<h2>📅 주요 일정</h2>
<ul>
  <li></li>
</ul>

<h2>📋 작업 항목</h2>
<ul>
  <li>[ ] </li>
</ul>`
  },
  {
    id: 'daily',
    name: '일일 계획',
    title: '일일 계획',
    content: `<h1>일일 계획</h1>
<p></p>
<h2>📅 날짜</h2>
<p></p>

<h2>⭐ 오늘의 목표</h2>
<ol>
  <li></li>
</ol>

<h2>📝 할 일</h2>
<ul>
  <li>[ ] </li>
</ul>

<h2>🏆 성과</h2>
<ul>
  <li></li>
</ul>

<h2>💭 회고</h2>
<p></p>`
  }
];