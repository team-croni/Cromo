import { LegalLayout } from "@/components/layout/legal-layout";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="개인정보 처리방침"
      lastUpdated="2026년 1월 20일"
    >
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">1. 개인정보의 처리 목적</h2>
        <p>
          Croni(이하 &quot;회사&quot;)는 다음의 목적을 위하여 Cromo 서비스의 제공과 관련하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>회원 가입 및 식별, 본인 확인</li>
          <li>AI 기반 콘텐츠 분석, 요약, 자동 분류 등 서비스 핵심 기능 제공</li>
          <li>실시간 협업 및 공유 기능 운영</li>
          <li>서비스 개선을 위한 통계 분석 및 신규 서비스 개발</li>
          <li>고객 상담 및 불만 처리</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">2. 개인정보의 처리 및 보유 기간</h2>
        <p>
          회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>회원 가입 정보:</strong> 회원 탈퇴 시까지 (단, 부정 이용 방지 및 이용자 보호를 위해 탈퇴 후 90일간 유예 기간을 두어 보관 후 파기)</li>
          <li><strong>서비스 이용 기록:</strong> 1년 (통신비밀보호법에 따른 보관)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">3. 처리하는 개인정보 항목</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>필수항목:</strong> 이메일 주소, 이름(닉네임), 프로필 사진(소셜 로그인 시)</li>
          <li><strong>서비스 이용 과정에서 생성되는 정보:</strong> 메모 본문, 태그, 카테고리 설정 값, 실시간 커서 위치 및 편집 로그</li>
          <li><strong>자동 수집 항목:</strong> IP 주소, 쿠키, 기기 정보, 브라우저 유형, 접속 로그</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">4. 개인정보의 위탁 및 국외 이전</h2>
        <p>
          회사는 원활한 AI 기능 제공을 위해 다음과 같이 개인정보 처리 업무를 국외 법인에 위탁하고 있습니다. 이용자는 서비스 이용을 통해 본 위탁 및 이전에 동의하게 됩니다.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-700">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2 border border-gray-700">수탁업체</th>
                <th className="p-2 border border-gray-700">이전국가</th>
                <th className="p-2 border border-gray-700">위탁 업무 및 항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-gray-700">OpenAI, OpenRouter</td>
                <td className="p-2 border border-gray-700">미국</td>
                <td className="p-2 border border-gray-700">AI 분석을 위한 메모 데이터 전송 및 처리</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">5. 데이터의 파기 및 백업 권고</h2>
        <p>
          회사는 개인정보 처리목적이 달성된 경우 지체 없이 해당 정보를 파기합니다. 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.
        </p>
        <blockquote className="mt-4 p-4 bg-yellow-900/20 border-l-4 border-yellow-600">
          본 서비스는 <strong>베타 테스트 단계</strong>로, 시스템 오류로 인한 데이터 손실 가능성이 있습니다. 사용자는 중요한 정보를 수시로 별도 저장소에 백업하시기를 강력히 권고드립니다.
        </blockquote>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">6. 개인정보 보호책임자</h2>
        <p>서비스 이용 중 발생하는 개인정보 관련 문의는 아래의 책임자에게 연락해 주시기 바랍니다.</p>
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
          <p><strong>이메일:</strong> team.croni@gmail.com</p>
        </div>
      </section>
    </LegalLayout>
  );
}