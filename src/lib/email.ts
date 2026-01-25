import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 이메일 전송을 위한 유틸리티 함수들
 */

interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
  userAgent?: string;
  ip?: string;
}

/**
 * 관리자에게 문의 알림 이메일을 전송합니다.
 * @param contactData 문의 데이터
 */
export async function sendContactNotification(contactData: ContactEmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY가 설정되지 않았습니다. 이메일 전송을 건너뜁니다.');
      return true; // API 키가 없어도 문의는 처리되도록 함
    }

    if (!process.env.CONTACT_EMAIL_TO) {
      console.warn('CONTACT_EMAIL_TO가 설정되지 않았습니다. 이메일 전송을 건너뜁니다.');
      return true;
    }

    const response = await resend.emails.send({
      from: process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev',
      to: process.env.CONTACT_EMAIL_TO,
      subject: `[CROMO 문의] ${contactData.subject}`,
      html: `
        <h2>새로운 문의가 도착했습니다</h2>
        <p><strong>이름:</strong> ${contactData.name}</p>
        <p><strong>이메일:</strong> ${contactData.email}</p>
        <p><strong>제목:</strong> ${contactData.subject}</p>
        <p><strong>내용:</strong></p>
        <p>${contactData.message.replace(/\n/g, '<br>')}</p>
        <hr />
        <p><strong>User Agent:</strong> ${contactData.userAgent || 'N/A'}</p>
        <p><strong>IP:</strong> ${contactData.ip || 'N/A'}</p>
      `,
    });

    if (response.error) {
      console.error('이메일 전송 실패:', response.error);
      return false;
    }

    console.log('📧 문의 알림 이메일 전송 성공:', response.data?.id);
    return true;
  } catch (error) {
    console.error('이메일 전송 중 오류:', error);
    return false;
  }
}