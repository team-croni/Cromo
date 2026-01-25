import { NextResponse } from 'next/server';
import {
  getAllContactMessages,
  getContactMessageById,
  updateContactMessageReadStatus,
  deleteContactMessage
} from '@/services/contactService';

// 모든 문의 메시지 조회 (관리자용)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isRead = url.searchParams.get('isRead');
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');

    const parsedIsRead = isRead !== null ? isRead === 'true' : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;

    const contacts = await getAllContactMessages(
      parsedIsRead,
      parsedLimit,
      parsedOffset
    );

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('문의 메시지 조회 중 오류:', error);
    return NextResponse.json(
      { error: '문의 메시지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 문의 메시지 삭제 (관리자용)
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: '삭제할 문의 메시지 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const deleted = await deleteContactMessage(id);

    if (!deleted) {
      return NextResponse.json(
        { error: '문의 메시지 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '문의 메시지가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('문의 메시지 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '문의 메시지 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}