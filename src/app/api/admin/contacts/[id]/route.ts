import { NextResponse } from 'next/server';
import { updateContactMessageReadStatus, getContactMessageById } from '@/services/contactService';

// 특정 문의 메시지 상태 업데이트 (관리자용)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isRead } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '문의 메시지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'isRead 값은 boolean 타입이어야 합니다.' },
        { status: 400 }
      );
    }

    const updatedContact = await updateContactMessageReadStatus(id, isRead);

    return NextResponse.json({
      success: true,
      contact: updatedContact
    });
  } catch (error) {
    console.error('문의 메시지 상태 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '문의 메시지 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 문의 메시지 조회 (관리자용)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: '문의 메시지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const contact = await getContactMessageById(id);

    if (!contact) {
      return NextResponse.json(
        { error: '해당 문의 메시지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('문의 메시지 조회 중 오류:', error);
    return NextResponse.json(
      { error: '문의 메시지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}