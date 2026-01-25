import ContactForm from '@components/contact/ContactForm';
import Link from 'next/link';
import React from 'react';

const ContactPage = () => {
  return (
    <div className='flex-1'>
      <div className="w-full min-h-screen bg-background pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">문의하기</h1>
            <p className="text-muted-foreground">
              문의 사항이 있으시면 아래 양식을 통해 연락 주세요.
            </p>
          </div>

          <div className="bg-background rounded-2xl shadow-2xl/15 p-6 md:p-8 border border-border">
            <ContactForm />

            {/* 이용약관 및 개인정보 처리 방침 링크 추가 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                문의를 남기시면 Cromo의 <Link href="/terms" className="text-muted-foreground hover:underline">이용약관</Link> 및 <Link href="/privacy" className="text-muted-foreground hover:underline">개인정보처리방침</Link>에
                동의하는 것으로 간주됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;