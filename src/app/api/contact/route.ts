import { NextResponse } from 'next/server';
import { createContactMessage } from '@/services/contactService';
import { sendContactNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // 입력값 검증
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증 간단 체크
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 데이터베이스에 문의 저장
    const contactMessage = await createContactMessage({
      name,
      email,
      subject,
      message,
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // 이메일 알림 전송 (비동기적으로 처리)
    try {
      await sendContactNotification({
        name,
        email,
        subject,
        message,
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
    } catch (emailError) {
      console.error('이메일 알림 전송 중 오류:', emailError);
      // 이메일 전송 실패는 문의 처리에 영향을 주지 않음
    }

    return NextResponse.json(
      {
        success: true,
        message: '문의가 성공적으로 접수되었습니다.',
        id: contactMessage.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('문의 처리 중 오류:', error);
    return NextResponse.json(
      { error: '문의 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}