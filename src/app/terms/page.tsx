import { LegalLayout } from "@/components/layout/legal-layout";

export default function TermsPage() {
  return (
    <LegalLayout
      title="이용 약관"
      lastUpdated="2026년 1월 20일"
    >
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">제1조 (목적)</h2>
        <p>
          본 약관은 Croni(이하 &quot;회사&quot;)가 제공하는 Cromo 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">제2조 (서비스의 내용 및 AI 기능)</h2>
        <p>회사는 회원에게 메모 작성, 실시간 협업, AI 기반 콘텐츠 분석 서비스를 제공합니다.</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>회원은 AI 기능을 통해 생성된 결과물을 자유롭게 이용할 수 있습니다.</li>
          <li>단, AI가 생성한 결과물은 기술적 한계로 인해 부정확하거나 편향된 정보를 포함할 수 있으며, 회사는 결과물의 완전성이나 정확성을 보증하지 않습니다.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">제3조 (콘텐츠에 대한 권리와 책임)</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>회원이 서비스 내에 입력한 메모 등 콘텐츠의 저작권은 회원 본인에게 귀속됩니다.</li>
          <li>회사는 서비스 운영, 개선 및 시스템 유지보수를 위한 최소한의 범위 내에서 회원의 콘텐츠를 참조할 수 있으며, AI 모델 학습에는 비식별화된 형태의 익명화된 데이터만을 사용합니다.</li>
          <li>회원은 타인의 저작권을 침해하는 내용을 입력해서는 안 되며, 이로 인해 발생하는 법적 책임은 회원 본인에게 있습니다.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">제4조 (베타 서비스 및 책임 제한)</h2>
        <p>
          본 서비스는 현재 정식 출시 전 <strong>베타 테스트 단계</strong>입니다.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>회사는 베타 서비스 기간 중 발생할 수 있는 데이터 유실, 서비스 중단, 기능 오류에 대해 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
          <li>회사는 천재지변, 외부 AI API 제공업체의 장애 등 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">제5조 (계정 삭제 및 데이터 처리)</h2>
        <p>
          회원이 탈퇴를 요청할 경우, 회사는 즉시 탈퇴 절차를 진행합니다. 다만, 사용자의 실수로 인한 복구 요청에 대비하여 탈퇴 후 최대 90일간 데이터를 암호화하여 임시 보관할 수 있으며, 이 기간이 경과하면 복구가 불가능하도록 영구 삭제합니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">제6조 (약관 변경 및 대응 방침)</h2>
        <p>
          회사는 서비스 운영상 중요한 변경 사항이 있을 경우, 이용 목적 변경 시 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
        </p>
      </section>

      <div className="mt-8 pt-8 border-t border-gray-800">
        <p className="text-sm text-gray-400">
          본 약관에 명시되지 않은 사항은 대한민국 법령 및 상관례에 따릅니다.<br />
          서비스 관련 문의: team.croni@gmail.com
        </p>
      </div>
    </LegalLayout>
  );
}