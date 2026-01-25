import { prisma } from '@/lib/db';

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  userAgent?: string;
  ip?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
  isRead: boolean;
}

/**
 * 새로운 문의 메시지를 생성합니다.
 * @param data 문의 메시지 데이터
 * @returns 생성된 문의 메시지
 */
export async function createContactMessage(data: ContactMessageInput): Promise<ContactMessage> {
  try {
    const contactMessage = await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        userAgent: data.userAgent,
        ip: data.ip,
        isRead: false
      }
    });

    return {
      id: contactMessage.id,
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
      message: contactMessage.message,
      userAgent: contactMessage.userAgent || undefined,
      ip: contactMessage.ip || undefined,
      createdAt: contactMessage.createdAt,
      updatedAt: contactMessage.updatedAt,
      isRead: contactMessage.isRead
    };
  } catch (error) {
    console.error('문의 메시지 생성 중 오류:', error);
    throw new Error('문의 메시지 저장에 실패했습니다.');
  }
}

/**
 * 모든 문의 메시지를 조회합니다.
 * @param isRead 읽음 상태 여부 (선택 사항)
 * @param limit 가져올 메시지 수 (선택 사항)
 * @param offset 건너뛸 메시지 수 (선택 사항)
 * @returns 문의 메시지 목록
 */
export async function getAllContactMessages(
  isRead?: boolean,
  limit?: number,
  offset?: number
): Promise<ContactMessage[]> {
  try {
    const whereClause: any = {};
    if (typeof isRead === 'boolean') {
      whereClause.isRead = isRead;
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset })
    });

    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      userAgent: contact.userAgent || undefined,
      ip: contact.ip || undefined,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      isRead: contact.isRead
    }));
  } catch (error) {
    console.error('문의 메시지 조회 중 오류:', error);
    throw new Error('문의 메시지 조회에 실패했습니다.');
  }
}

/**
 * 특정 문의 메시지를 ID로 조회합니다.
 * @param id 문의 메시지 ID
 * @returns 문의 메시지
 */
export async function getContactMessageById(id: string): Promise<ContactMessage | null> {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      return null;
    }

    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      userAgent: contact.userAgent || undefined,
      ip: contact.ip || undefined,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      isRead: contact.isRead
    };
  } catch (error) {
    console.error('문의 메시지 조회 중 오류:', error);
    throw new Error('문의 메시지 조회에 실패했습니다.');
  }
}

/**
 * 문의 메시지의 읽음 상태를 업데이트합니다.
 * @param id 문의 메시지 ID
 * @param isRead 읽음 상태
 * @returns 업데이트된 문의 메시지
 */
export async function updateContactMessageReadStatus(id: string, isRead: boolean): Promise<ContactMessage> {
  try {
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: { isRead }
    });

    return {
      id: updatedContact.id,
      name: updatedContact.name,
      email: updatedContact.email,
      subject: updatedContact.subject,
      message: updatedContact.message,
      userAgent: updatedContact.userAgent || undefined,
      ip: updatedContact.ip || undefined,
      createdAt: updatedContact.createdAt,
      updatedAt: updatedContact.updatedAt,
      isRead: updatedContact.isRead
    };
  } catch (error) {
    console.error('문의 메시지 상태 업데이트 중 오류:', error);
    throw new Error('문의 메시지 상태 업데이트에 실패했습니다.');
  }
}

/**
 * 문의 메시지를 삭제합니다.
 * @param id 문의 메시지 ID
 * @returns 삭제 결과
 */
export async function deleteContactMessage(id: string): Promise<boolean> {
  try {
    await prisma.contact.delete({
      where: { id }
    });

    return true;
  } catch (error) {
    console.error('문의 메시지 삭제 중 오류:', error);
    throw new Error('문의 메시지 삭제에 실패했습니다.');
  }
}