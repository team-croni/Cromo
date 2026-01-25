import { LegalLayout } from "@/components/layout/legal-layout";

export default function CookiesPage() {
  return (
    <LegalLayout
      title="쿠키 정책"
      lastUpdated="2026년 1월 20일"
    >
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">쿠키란 무엇인가요?</h2>
        <p>
          쿠키(Cookie)는 웹사이트를 방문할 때 사용자의 브라우저에 저장되는 작은 텍스트 파일입니다. Croni는 Cromo 서비스의 사용자 경험을 개선하고 서비스의 효율적인 운영을 위해 쿠키를 사용합니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">사용하는 쿠키의 종류</h2>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>
            <strong>필수 쿠키:</strong> 서비스의 기본적인 기능을 수행하기 위해 반드시 필요한 쿠키입니다. 로그인 상태 유지, 보안 기능 등이 이에 포함됩니다.
          </li>
          <li>
            <strong>기능성 쿠키:</strong> 사용자의 설정을 저장하여 개인화된 경험을 제공하는 데 사용됩니다. 예를 들어, 언어 설정이나 테마 설정 등이 있습니다.
          </li>
          <li>
            <strong>분석 쿠키:</strong> 서비스 이용 현황을 분석하여 성능을 개선하는 데 사용됩니다. 방문자 수, 페이지 조회 수 등의 통계를 수집합니다.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">쿠키 관리 방법</h2>
        <p>
          사용자는 브라우저 설정을 통해 쿠키 저장에 대한 거부 또는 삭제를 할 수 있습니다. 단, 필수 쿠키의 저장을 거부할 경우 로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.
        </p>
        <p className="mt-4">
          주요 브라우저의 쿠키 설정 방법:
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Chrome: 설정 {'>'} 개인정보 및 보안 {'>'} 쿠키 및 기타 사이트 데이터</li>
          <li>Safari: 환경설정 {'>'} 개인정보 보호</li>
          <li>Edge: 설정 {'>'} 쿠키 및 사이트 권한</li>
        </ul>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-800">
        <p className="text-sm text-gray-400">
          쿠키 정책에 관한 문의사항은 team.croni@gmail.com으로 연락 주시기 바랍니다.
        </p>
      </div>
    </LegalLayout>
  );
}
