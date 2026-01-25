"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "제 개인 메모가 AI 모델 학습에 사용되나요?",
    answer: "아니요, 절대 사용되지 않습니다. 작성하신 메모는 서비스 제공을 위해 데이터베이스에 안전하게 저장되지만, AI 모델의 학습 데이터로는 활용되지 않습니다."
  },
  {
    question: "정확한 단어가 기억나지 않아도 메모를 찾을 수 있나요?",
    answer: "네, 가능합니다. 단순 키워드 매칭뿐만 아니라 '지난주 회의 내용'이나 '프로젝트 아이디어'처럼 문맥과 의미를 기반으로 찾아주는 하이브리드 검색(Hybrid Search) 기능을 제공합니다."
  },
  {
    question: "다른 사람들과 동시에 편집할 수 있나요?",
    answer: "물론입니다. 공유 링크를 통해 사용자를 초대하면, 서로의 커서 위치와 입력 내용을 실시간으로 확인하며 지연 없이 동시에 문서를 작성하고 수정할 수 있습니다."
  },
  {
    question: "메모 정리는 어떻게 하나요?",
    answer: "직관적인 폴더 구조와 태그 시스템을 제공합니다. AI가 메모 내용을 분석하여 적절한 태그나 카테고리를 제안해주어 정리가 한결 쉬워집니다."
  },
  {
    question: "별도의 앱 설치가 필요한가요?",
    answer: "Cromo는 웹 표준 기술(PWA)로 만들어져 별도 설치 없이 브라우저에서 바로 이용 가능합니다. 모바일이나 데스크톱 홈 화면에 추가하면 네이티브 앱처럼 쾌적하게 사용할 수 있습니다."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative bg-[#151618] py-30 z-10">
      <div className="container px-4 mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold mb-12 text-center">자주 묻는 질문</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-2xl bg-background overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted-foreground/5"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180 text-foreground' : 'text-muted-foreground/50'}`} />
              </button>
              {openIndex === index && (
                <div
                  id={`faq-answer-${index}`}
                  className="px-6 pt-4 pb-5 text-muted-foreground leading-relaxed border-t border-border/50 bg-muted/10 transition-all fade-in slide-in-from-top-2 duration-300"
                >
                  <p className="text-sm">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="container">
        <div className="mt-16 text-center p-20">
          <h3 className="text-xl font-semibold mb-2">원하는 답변을 찾지 못하셨나요?</h3>
          <p className="text-muted-foreground mb-6">
            지원 팀에 직접 문의해 주세요. 영업일 기준 24시간 이내에 답변을 드릴 수 있도록 노력하겠습니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/contact"
              className="px-6 py-3 rounded-full font-medium transition duration-200 hover:text-foreground border border-muted-foreground/30 bg-transparent hover:border-muted-foreground/80"
            >
              이메일로 문의하기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}