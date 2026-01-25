import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🎨 Persona: Sarah Kim (Senior Product Designer) -> 김사라 (시니어 프로덕트 디자이너)
// Scenario: "Cromo 모바일 앱 V2" 런칭 & 디자인 시스템 관리

const createRichDummyData = () => {
  const now = new Date();

  // 날짜 생성을 위한 헬퍼 함수
  const getPastDate = (daysAgo: number, hoursAgo: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);
    return date;
  };

  return [
    {
      name: 'V2 런칭 스프린트',
      icon: 'Rocket',
      color: 'rose',
      createdAt: getPastDate(14), // 2주 전 생성
      updatedAt: getPastDate(2),  // 2일 전 폴더 수정
      memos: [
        {
          title: '런칭 이벤트 키노트 초안',
          content: `
            <h2>📢 키노트 스피치 개요</h2>
            <p><strong>주제:</strong> "사고의 동기화 (Synchronization of Thought)"</p>
            <p><strong>발표 시간:</strong> 45분</p>
            <h3>섹션 1: 문제 제기 (00:00 - 10:00)</h3>
            <ul>
              <li>현재 워크플로우 도구들의 파편화 문제.</li>
              <li>"우리는 왜 하루에 50번씩 컨텍스트 스위칭을 해야 하는가?"</li>
              <li>좌절하는 사용자의 이야기 (페르소나: 알렉스).</li>
            </ul>
            <h3>섹션 2: Cromo V2 소개 (10:00 - 25:00)</h3>
            <p>새로운 <strong>"뉴럴 폴더(Neural Folder)"</strong> 시스템 공개.</p>
            <blockquote>"이것은 단순한 저장소가 아닙니다. 스스로 정리하는 제2의 뇌입니다."</blockquote>
            <h3>섹션 3: 라이브 데모 (25:00 - 40:00)</h3>
            <ul>
              <li>실시간 협업 기능 시연.</li>
              <li>AI 기반 자동 정리 기능 데모.</li>
            </ul>
            <p><em>참고: 금요일까지 엔지니어링 팀과 리허설 필요.</em></p>
          `,
          createdAt: getPastDate(7), // 1주 전 생성
          updatedAt: getPastDate(0, 2), // 2시간 전 수정 (가장 최신)
        },
        {
          title: '스토어 앱 설명 및 리소스',
          content: `
            <h2>앱 스토어 최적화 (ASO)</h2>
            <h3>짧은 설명</h3>
            <p>Cromo는 팀의 아이디어가 즉시 동기화되는 워크스페이스입니다. 협업 지식 관리의 미래를 경험하세요.</p>
            <h3>주요 기능</h3>
            <ul>
              <li><strong>실시간 동기화:</strong> 지연 없는 완벽한 협업.</li>
              <li><strong>AI 정리:</strong> 자동으로 정리되는 폴더 구조.</li>
              <li><strong>리치 에디터:</strong> 마크다운 + 블록 기반 편집 지원.</li>
            </ul>
            <h3>필요 리소스</h3>
            <ul>
              <li>[ ] 히어로 배너 (1920x1080) - <em>작업 중</em></li>
              <li>[x] 앱 아이콘 V2 (원형/사각형 변형)</li>
              <li>[ ] 아이폰 15 Pro Max용 스크린샷 5장</li>
            </ul>
          `,
          createdAt: getPastDate(8),
          updatedAt: getPastDate(3),
        },
      ]
    },
    {
      name: '디자인 시스템',
      icon: 'Palette',
      color: 'indigo',
      createdAt: getPastDate(30), // 한 달 전 생성
      updatedAt: getPastDate(5),
      memos: [
        {
          title: '타이포그래피 & 컬러 팔레트 2026',
          content: `
            <h2>시스템 폰트</h2>
            <p>모든 CJK 로케일에는 <strong>Pretendard Variable</strong>을, 영문에는 <strong>Inter</strong>를 사용합니다.</p>
            <pre><code>font-family: 'Pretendard Variable', 'Inter', sans-serif;</code></pre>
            <h2>주요 색상</h2>
            <ul>
              <li><strong>Primary 500:</strong> <span style="color: #6366f1">#6366f1</span> (Indigo)</li>
              <li><strong>Secondary 500:</strong> <span style="color: #ec4899">#ec4899</span> (Pink)</li>
              <li><strong>Success:</strong> <span style="color: #22c55e">#22c55e</span> (Green)</li>
            </ul>
            <h2>다크 모드 규칙</h2>
            <p>더 나은 대비 처리를 위해 완전한 검은색 대신 <code>bg-zinc-900</code>을 배경색으로 사용하세요.</p>
          `,
          createdAt: getPastDate(25),
          updatedAt: getPastDate(10),
        },
        {
          title: '컴포넌트 현황: 1분기',
          content: `
            <h2>컴포넌트 라이브러리 감사(Audit)</h2>
            <table>
              <thead>
                <tr>
                  <th>컴포넌트</th>
                  <th>상태</th>
                  <th>우선순위</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>버튼 (Variants)</td>
                  <td>✅ 완료</td>
                  <td>낮음</td>
                </tr>
                <tr>
                  <td>데이터 그리드</td>
                  <td>🚧 진행 중</td>
                  <td>높음</td>
                </tr>
                <tr>
                  <td>모달 대화상자</td>
                  <td>✅ 완료</td>
                  <td>낮음</td>
                </tr>
                <tr>
                  <td>리치 텍스트 툴바</td>
                  <td>⚠️ 리팩토링 필요</td>
                  <td>긴급</td>
                </tr>
              </tbody>
            </table>
            <p><strong>다음 행동:</strong> 툴바 리팩토링과 관련하여 프론트엔드 팀과 미팅 잡기.</p>
          `,
          createdAt: getPastDate(20),
          updatedAt: getPastDate(1, 5), // 1일 5시간 전 수정
        },
      ]
    },
    {
      name: '사용자 리서치',
      icon: 'Users',
      color: 'teal',
      createdAt: getPastDate(21),
      updatedAt: getPastDate(4),
      memos: [
        {
          title: '인터뷰 노트: 사용자 #402 (파워 유저)',
          content: `
            <p><strong>날짜:</strong> 2026년 1월 20일<br><strong>참여자:</strong> 김민수 (테크 리드)</p>
            <h3>주요 인사이트</h3>
            <p>민수님은 Cromo를 주로 스프린트 회고 관리에 사용합니다.</p>
            <ul>
              <li><strong>불편한 점:</strong> 검색은 빠르지만, "수정된 날짜"로 필터링하는 기능이 너무 깊숙이 숨겨져 있음.</li>
              <li><strong>좋았던 점:</strong> 새로운 "다크 모드" 그라디언트 디자인을 매우 좋아함.</li>
            </ul>
            <h3>인용구</h3>
            <blockquote>"예전에는 Notion을 썼지만, 회의 중 빠르게 기록을 남길 때는 Cromo의 속도를 따라올 수 없네요."</blockquote>
            <h3>액션 아이템</h3>
            <ul>
              <li>[ ] 필터 옵션을 상단 툴바 밖으로 꺼내기.</li>
              <li>[ ] 민수님께 굿즈 패키지 발송.</li>
            </ul>
          `,
          createdAt: getPastDate(15),
          updatedAt: getPastDate(15),
        },
      ]
    },
    {
      name: '여행 및 개인',
      icon: 'Plane',
      color: 'orange',
      createdAt: getPastDate(45),
      updatedAt: getPastDate(20),
      memos: [
        {
          title: '교토 벚꽃 여행 계획 🌸',
          content: `
            <h2>1일차: 도착 및 기온 거리</h2>
            <ul>
              <li>09:00 - 간사이 공항(KIX) 도착</li>
              <li>11:00 - 료칸 체크인</li>
              <li>13:00 - 니시키 시장에서 점심 식사</li>
              <li>18:00 - 기온 거리 산책</li>
            </ul>
            <h2>2일차: 사찰 투어</h2>
            <ul>
              <li>07:00 - 후시미 이나리 (사람 몰리기 전에 일찍!)</li>
              <li>12:00 - 청수사 (기요미즈데라)</li>
            </ul>
            <p><strong>준비물:</strong> 카메라, 보조 배터리, 편안한 운동화.</p>
          `,
          createdAt: getPastDate(40),
          updatedAt: getPastDate(40),
        },
        {
          title: '2026년 독서 목록',
          content: `
            <h2>디자인 & 기술</h2>
            <ul>
              <li><em>Refactoring UI</em> - Adam Wathan</li>
              <li><em>도널드 노먼의 디자인과 인간 심리</em> (재독)</li>
            </ul>
            <h2>소설</h2>
            <ul>
              <li><em>프로젝트 헤일메리</em> - 앤디 위어</li>
              <li><em>다크 매터</em> - 블레이크 크라우치</li>
            </ul>
          `,
          createdAt: getPastDate(10),
          updatedAt: getPastDate(10),
        },
      ]
    },
  ];
};

async function main() {
  console.log('🎬 데모 데이터 주입 시작 (페르소나: 시니어 프로덕트 디자이너)...');

  const existingUsers = await prisma.user.findMany();
  console.log(`👤 기존 사용자 ${existingUsers.length}명 발견.`);

  if (existingUsers.length === 0) {
    console.log('⚠️ 사용자가 없습니다. 기본 데모 사용자를 생성합니다...');
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@cromo.app',
        name: '김사라',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4',
      },
    });
    existingUsers.push(demoUser);
  }

  for (const user of existingUsers) {
    console.log(`🧹 ${user.email}의 데이터 정리 중...`);

    await prisma.userSharedMemo.deleteMany({
      where: { memo: { userId: user.id } }
    });
    await prisma.memo.deleteMany({ where: { userId: user.id } });
    await prisma.folder.deleteMany({ where: { userId: user.id } });

    console.log(`🌱 ${user.email}에게 날짜가 포함된 풍부한 데모 데이터 생성 중...`);
    const templates = createRichDummyData();

    for (const folderTmpl of templates) {
      const folder = await prisma.folder.create({
        data: {
          name: folderTmpl.name,
          icon: folderTmpl.icon,
          color: folderTmpl.color,
          userId: user.id,
          createdAt: folderTmpl.createdAt,
          updatedAt: folderTmpl.updatedAt,
        },
      });

      for (const memoTmpl of folderTmpl.memos) {
        await prisma.memo.create({
          data: {
            title: memoTmpl.title,
            content: memoTmpl.content,
            folderId: folder.id,
            userId: user.id,
            createdAt: memoTmpl.createdAt,
            updatedAt: memoTmpl.updatedAt,
          },
        });
      }
    }
  }

  console.log('\n✨ 날짜가 포함된 데모 데이터 주입 완료! ✨');
  console.log('👉 정렬 필터를 "수정일 순"으로 설정하여 확인해보세요.');
}

main()
  .catch((e) => {
    console.error('❌ 데모 데이터 생성 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });