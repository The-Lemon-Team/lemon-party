import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatKind, ChatLinkDirection } from '@prisma/client';
import {
  detectContentTypeIds,
  documentFromStored,
  type MessageDocument,
} from '@lemon-party/blocks';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatCollectionDto } from './dto/create-chat-collection.dto';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateUpwardGrantDto } from './dto/create-upward-grant.dto';
import { UpdateChatCollectionDto } from './dto/update-chat-collection.dto';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'chat';
}

async function uniqueSlug(
  prisma: PrismaService,
  userId: string,
  base: string,
  table: 'chat' | 'collection',
): Promise<string> {
  let slug = slugify(base);
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const exists =
      table === 'chat'
        ? await prisma.chat.findUnique({
            where: { userId_slug: { userId, slug: candidate } },
          })
        : await prisma.chatCollection.findUnique({
            where: { userId_slug: { userId, slug: candidate } },
          });

    if (!exists) return candidate;
    suffix += 1;
  }
}

export type UpwardTarget = {
  chatId: string;
  chatName: string;
  kind: ChatKind;
  via: 'parent' | 'grant';
};

export type UpwardGrantItem = {
  id: string;
  fromChatId: string;
  fromChatName: string;
  toChatId: string;
  toChatName: string;
  createdAt: string;
};

export type ContentTypeSummaryItem = {
  id: 'design' | 'lofi' | 'music' | 'video';
  label: string;
  count: number;
};

export type ChatContentSummary = {
  chatId: string;
  totalMessages: number;
  types: ContentTypeSummaryItem[];
};

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async seedForUser(userId: string) {
    const existing = await this.prisma.chat.findFirst({
      where: { userId, kind: ChatKind.GENERAL },
    });
    if (existing) return existing;

    return this.prisma.chat.create({
      data: {
        name: 'general',
        slug: 'general',
        kind: ChatKind.GENERAL,
        userId,
        isPinned: true,
        sortOrder: 0,
      },
    });
  }

  async listForUser(userId: string) {
    const [collectionsRaw, chatsRaw, lastMessageAtByChatId] = await Promise.all([
      this.prisma.chatCollection.findMany({
        where: { userId },
        include: { chats: true },
      }),
      this.prisma.chat.findMany({
        where: { userId },
        orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { collection: true, parentChat: true },
      }),
      this.getLastMessageAtByChatId(userId),
    ]);

    const attachLastMessageAt = <T extends { id: string; createdAt: Date }>(chat: T) => ({
      ...chat,
      lastMessageAt: (
        lastMessageAtByChatId.get(chat.id) ?? chat.createdAt
      ).toISOString(),
    });

    const chats = chatsRaw.map(attachLastMessageAt);

    const collections = collectionsRaw
      .map((collection) => {
        const collectionChats = collection.chats
          .map(attachLastMessageAt)
          .sort((a, b) => this.compareByRecency(a, b));

        const lastMessageAt = collectionChats[0]?.lastMessageAt ?? collection.createdAt.toISOString();

        return {
          ...collection,
          chats: collectionChats,
          lastMessageAt,
        };
      })
      .sort((a, b) => this.compareByRecency(a, b));

    const general = chats.find((chat) => chat.kind === ChatKind.GENERAL) ?? null;
    const standalone = chats.filter(
      (chat) => chat.kind !== ChatKind.GENERAL && !chat.collectionId,
    );

    return { general, collections, standalone, chats };
  }

  async getGeneralChat(userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { userId, kind: ChatKind.GENERAL },
    });
    if (!chat) {
      return this.seedForUser(userId);
    }
    return chat;
  }

  async findOwnedChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }
    return chat;
  }

  async createCollection(userId: string, dto: CreateChatCollectionDto) {
    const slug = await uniqueSlug(this.prisma, userId, dto.name, 'collection');
    const count = await this.prisma.chatCollection.count({ where: { userId } });

    return this.prisma.chatCollection.create({
      data: {
        name: dto.name.trim(),
        slug,
        userId,
        sortOrder: count,
      },
    });
  }

  async findOwnedCollection(userId: string, collectionId: string) {
    const collection = await this.prisma.chatCollection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) {
      throw new NotFoundException('Группа чатов не найдена');
    }
    return collection;
  }

  async updateCollection(
    userId: string,
    collectionId: string,
    dto: UpdateChatCollectionDto,
  ) {
    const collection = await this.findOwnedCollection(userId, collectionId);
    const name = dto.name.trim();
    const slug =
      name === collection.name
        ? collection.slug
        : await uniqueSlug(this.prisma, userId, name, 'collection');

    return this.prisma.chatCollection.update({
      where: { id: collectionId },
      data: { name, slug },
    });
  }

  async deleteCollection(userId: string, collectionId: string) {
    await this.findOwnedCollection(userId, collectionId);
    await this.prisma.chatCollection.delete({ where: { id: collectionId } });
    return { ok: true };
  }

  async setCollection(
    userId: string,
    chatId: string,
    collectionId: string | null | undefined,
  ) {
    const chat = await this.findOwnedChat(userId, chatId);
    if (chat.kind === ChatKind.GENERAL) {
      throw new BadRequestException('General нельзя добавить в группу');
    }

    const nextCollectionId = collectionId ?? null;
    if (nextCollectionId === chat.collectionId) {
      return this.prisma.chat.findUniqueOrThrow({
        where: { id: chatId },
        include: { collection: true, parentChat: true },
      });
    }

    if (nextCollectionId) {
      await this.findOwnedCollection(userId, nextCollectionId);
    }

    const count = await this.prisma.chat.count({
      where: { userId, collectionId: nextCollectionId },
    });

    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        collectionId: nextCollectionId,
        isPinned: nextCollectionId ? false : chat.isPinned,
        sortOrder: nextCollectionId ? count : chat.sortOrder,
      },
      include: { collection: true, parentChat: true },
    });
  }

  async createChat(userId: string, dto: CreateChatDto) {
    const name = dto.name.trim();
    if (name.toLowerCase() === 'general') {
      throw new BadRequestException('Имя general зарезервировано');
    }

    if (dto.collectionId) {
      const collection = await this.prisma.chatCollection.findFirst({
        where: { id: dto.collectionId, userId },
      });
      if (!collection) {
        throw new NotFoundException('Группа чатов не найдена');
      }
    }

    if (dto.parentChatId) {
      await this.validateParentAssignment(userId, null, dto.parentChatId);
    }

    const slug = await uniqueSlug(this.prisma, userId, name, 'chat');
    const count = await this.prisma.chat.count({
      where: { userId, collectionId: dto.collectionId ?? null },
    });

    const chat = await this.prisma.chat.create({
      data: {
        name,
        slug,
        kind: ChatKind.REGULAR,
        userId,
        collectionId: dto.collectionId ?? null,
        parentChatId: dto.parentChatId ?? null,
        sortOrder: count,
      },
      include: { collection: true, parentChat: true },
    });

    if (dto.parentChatId) {
      await this.syncHierarchyLinks(userId, chat.id, dto.parentChatId);
    }

    return chat;
  }

  async setParent(
    userId: string,
    chatId: string,
    parentChatId: string | null | undefined,
  ) {
    const chat = await this.findOwnedChat(userId, chatId);
    if (chat.kind === ChatKind.GENERAL) {
      throw new BadRequestException('У general не может быть родителя');
    }

    const nextParentId = parentChatId ?? null;
    if (nextParentId === chat.parentChatId) {
      return this.prisma.chat.findUniqueOrThrow({
        where: { id: chatId },
        include: { parentChat: true },
      });
    }

    if (nextParentId) {
      await this.validateParentAssignment(userId, chatId, nextParentId);
    }

    if (chat.parentChatId) {
      await this.removeHierarchyLinks(chat.id, chat.parentChatId);
    }

    const updated = await this.prisma.chat.update({
      where: { id: chatId },
      data: { parentChatId: nextParentId },
      include: { parentChat: true },
    });

    if (nextParentId) {
      await this.syncHierarchyLinks(userId, chatId, nextParentId);
      await this.prisma.message.create({
        data: {
          rawText: `Прикреплен дочерний чат: ${chat.name}`,
          userId,
          chatId: nextParentId,
        },
      });
    }

    return updated;
  }

  async setPin(userId: string, chatId: string, pinned: boolean) {
    const chat = await this.findOwnedChat(userId, chatId);
    if (
      chat.kind !== ChatKind.GENERAL &&
      (chat.collectionId || chat.parentChatId)
    ) {
      throw new BadRequestException(
        'Закрепление доступно только для самостоятельных чатов',
      );
    }

    const pinnedCount = await this.prisma.chat.count({
      where: {
        userId,
        isPinned: true,
        OR: [
          { kind: ChatKind.GENERAL },
          { kind: ChatKind.REGULAR, parentChatId: null },
        ],
      },
    });

    const updated = await this.prisma.chat.update({
      where: { id: chat.id },
      data: {
        isPinned: pinned,
        sortOrder: pinned ? pinnedCount : chat.sortOrder,
      },
      include: { collection: true, parentChat: true },
    });

    await this.normalizeStandaloneSortOrder(userId);
    return updated;
  }

  async reorder(userId: string, orderedChatIds: string[]) {
    const ids = Array.from(new Set(orderedChatIds));
    const chats = await this.prisma.chat.findMany({
      where: {
        userId,
        id: { in: ids },
        kind: ChatKind.REGULAR,
        parentChatId: null,
      },
      select: { id: true, isPinned: true },
    });

    if (chats.length !== ids.length) {
      throw new BadRequestException('Некоторые чаты не найдены');
    }

    const pinnedMap = new Map(chats.map((chat) => [chat.id, chat.isPinned]));
    const pinnedIds = ids.filter((id) => pinnedMap.get(id));
    const regularIds = ids.filter((id) => !pinnedMap.get(id));

    await this.prisma.$transaction([
      ...pinnedIds.map((chatId, index) =>
        this.prisma.chat.update({
          where: { id: chatId },
          data: { sortOrder: index },
        }),
      ),
      ...regularIds.map((chatId, index) =>
        this.prisma.chat.update({
          where: { id: chatId },
          data: { sortOrder: index },
        }),
      ),
    ]);

    await this.normalizeStandaloneSortOrder(userId);
    return this.listForUser(userId);
  }

  async createUpwardGrant(userId: string, dto: CreateUpwardGrantDto) {
    if (dto.fromChatId === dto.toChatId) {
      throw new BadRequestException('Нельзя выдать разрешение самому себе');
    }

    const [fromChat, toChat] = await Promise.all([
      this.findOwnedChat(userId, dto.fromChatId),
      this.findOwnedChat(userId, dto.toChatId),
    ]);

    if (fromChat.kind === ChatKind.GENERAL) {
      throw new BadRequestException('Из general нельзя отправлять replay вверх');
    }

    if (toChat.kind === ChatKind.GENERAL && fromChat.parentChatId !== toChat.id) {
      // grant to general is always explicit — allowed
    }

    const existingParent = fromChat.parentChatId === toChat.id;
    if (existingParent) {
      throw new BadRequestException(
        'Родительский чат уже доступен по умолчанию',
      );
    }

    return this.prisma.chatUpwardGrant.create({
      data: {
        userId,
        fromChatId: dto.fromChatId,
        toChatId: dto.toChatId,
      },
      include: {
        fromChat: true,
        toChat: true,
      },
    });
  }

  async deleteUpwardGrant(userId: string, grantId: string) {
    const grant = await this.prisma.chatUpwardGrant.findFirst({
      where: { id: grantId, userId },
    });
    if (!grant) {
      throw new NotFoundException('Разрешение не найдено');
    }

    await this.prisma.chatUpwardGrant.delete({ where: { id: grantId } });
    return { ok: true };
  }

  async listUpwardGrants(userId: string): Promise<UpwardGrantItem[]> {
    const grants = await this.prisma.chatUpwardGrant.findMany({
      where: { userId },
      include: {
        fromChat: { select: { id: true, name: true } },
        toChat: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return grants.map((grant) => ({
      id: grant.id,
      fromChatId: grant.fromChatId,
      fromChatName: grant.fromChat.name,
      toChatId: grant.toChatId,
      toChatName: grant.toChat.name,
      createdAt: grant.createdAt.toISOString(),
    }));
  }

  async getUpwardTargets(userId: string, chatId: string): Promise<UpwardTarget[]> {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        parentChat: true,
        upwardGrantsFrom: { include: { toChat: true } },
      },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    const targets = new Map<string, UpwardTarget>();

    if (chat.parentChat) {
      targets.set(chat.parentChat.id, {
        chatId: chat.parentChat.id,
        chatName: chat.parentChat.name,
        kind: chat.parentChat.kind,
        via: 'parent',
      });
    }

    for (const grant of chat.upwardGrantsFrom) {
      targets.set(grant.toChat.id, {
        chatId: grant.toChat.id,
        chatName: grant.toChat.name,
        kind: grant.toChat.kind,
        via: 'grant',
      });
    }

    return Array.from(targets.values());
  }

  async assertUpwardTargetAllowed(
    userId: string,
    fromChatId: string,
    targetChatId: string,
  ) {
    const targets = await this.getUpwardTargets(userId, fromChatId);
    const allowed = targets.some((target) => target.chatId === targetChatId);
    if (!allowed) {
      throw new ForbiddenFlowException(
        'Replay в этот чат не разрешён. Нужен родитель или явное разрешение.',
      );
    }
  }

  async getChildChats(userId: string, chatId: string) {
    await this.findOwnedChat(userId, chatId);
    return this.prisma.chat.findMany({
      where: { userId, parentChatId: chatId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getDownLinkPrefixSetting(
    userId: string,
    parentChatId: string,
    childChatId: string,
  ) {
    const link = await this.prisma.chatLink.findFirst({
      where: {
        userId,
        parentChatId,
        childChatId,
        direction: ChatLinkDirection.DOWN,
      },
    });
    return link?.includePrefix ?? true;
  }

  async getChannelActivity(userId: string, chatId: string, limit = 30) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: { parentChat: true },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (!chat.parentChatId) {
      return { parentChat: null, events: [] };
    }

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const events = await this.prisma.flowEvent.findMany({
      where: {
        userId,
        targetChatId: chat.parentChatId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sourceChat: { select: { id: true, name: true } },
        targetChat: { select: { id: true, name: true } },
      },
    });

    return {
      parentChat: chat.parentChat,
      events: events.map((event) => ({
        id: event.id,
        kind: event.kind,
        sourceChatId: event.sourceChatId,
        sourceChatName: event.sourceChat.name,
        targetChatId: event.targetChatId,
        targetChatName: event.targetChat.name,
        entryCount: event.entryCount,
        createdAt: event.createdAt.toISOString(),
        isOwn: event.sourceChatId === chatId,
      })),
    };
  }

  async getContentSummary(userId: string, chatId: string): Promise<ChatContentSummary> {
    await this.findOwnedChat(userId, chatId);

    const messages = await this.prisma.message.findMany({
      where: { userId, chatId },
      select: {
        rawText: true,
        content: true,
      },
    });

    const counts: Record<ContentTypeSummaryItem['id'], number> = {
      design: 0,
      lofi: 0,
      music: 0,
      video: 0,
    };

    for (const message of messages) {
      const document = documentFromStored(
        message.content as MessageDocument | null,
        message.rawText,
      );
      for (const typeId of detectContentTypeIds(document, message.rawText)) {
        counts[typeId] += 1;
      }
    }

    return {
      chatId,
      totalMessages: messages.length,
      types: [
        { id: 'design', label: 'Дизайн', count: counts.design },
        { id: 'lofi', label: 'Lo-fi', count: counts.lofi },
        { id: 'music', label: 'Музыка', count: counts.music },
        { id: 'video', label: 'Видео', count: counts.video },
      ],
    };
  }

  private async getLastMessageAtByChatId(userId: string) {
    const rows = await this.prisma.message.groupBy({
      by: ['chatId'],
      where: { userId },
      _max: { createdAt: true },
    });

    const map = new Map<string, Date>();
    for (const row of rows) {
      if (row._max.createdAt) {
        map.set(row.chatId, row._max.createdAt);
      }
    }
    return map;
  }

  private compareByRecency(
    a: { lastMessageAt?: string | Date | null; createdAt?: string | Date | null },
    b: { lastMessageAt?: string | Date | null; createdAt?: string | Date | null },
  ) {
    const aTs = new Date(a.lastMessageAt ?? a.createdAt ?? 0).getTime();
    const bTs = new Date(b.lastMessageAt ?? b.createdAt ?? 0).getTime();
    return bTs - aTs;
  }

  private async validateParentAssignment(
    userId: string,
    chatId: string | null,
    parentChatId: string,
  ) {
    const parent = await this.findOwnedChat(userId, parentChatId);

    if (chatId && parentChatId === chatId) {
      throw new BadRequestException('Чат не может быть родителем сам себе');
    }

    if (chatId && (await this.wouldCreateCycle(chatId, parentChatId))) {
      throw new BadRequestException('Нельзя создать циклическую иерархию');
    }

    if (parent.kind === ChatKind.GENERAL && chatId) {
      const child = await this.findOwnedChat(userId, chatId);
      if (child.kind === ChatKind.GENERAL) {
        throw new BadRequestException('general не может иметь родителя');
      }
    }
  }

  private async normalizeStandaloneSortOrder(userId: string) {
    const standalone = await this.prisma.chat.findMany({
      where: {
        userId,
        OR: [
          { kind: ChatKind.GENERAL },
          { kind: ChatKind.REGULAR, parentChatId: null },
        ],
      },
      orderBy: [
        { isPinned: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
      select: { id: true, isPinned: true },
    });

    const pinned = standalone.filter((chat) => chat.isPinned);
    const regular = standalone.filter((chat) => !chat.isPinned);
    const updates = [
      ...pinned.map((chat, index) =>
        this.prisma.chat.update({
          where: { id: chat.id },
          data: { sortOrder: index },
        }),
      ),
      ...regular.map((chat, index) =>
        this.prisma.chat.update({
          where: { id: chat.id },
          data: { sortOrder: index },
        }),
      ),
    ];
    if (updates.length > 0) {
      await this.prisma.$transaction(updates);
    }
  }

  private async wouldCreateCycle(chatId: string, newParentId: string) {
    let current: string | null = newParentId;

    while (current) {
      if (current === chatId) return true;
      const node: { parentChatId: string | null } | null =
        await this.prisma.chat.findUnique({
          where: { id: current },
          select: { parentChatId: true },
        });
      current = node?.parentChatId ?? null;
    }

    return false;
  }

  private async syncHierarchyLinks(
    userId: string,
    childChatId: string,
    parentChatId: string,
  ) {
    await this.prisma.chatLink.upsert({
      where: {
        childChatId_parentChatId_direction: {
          childChatId,
          parentChatId,
          direction: ChatLinkDirection.UP,
        },
      },
      create: {
        userId,
        childChatId,
        parentChatId,
        direction: ChatLinkDirection.UP,
      },
      update: {},
    });

    await this.prisma.chatLink.upsert({
      where: {
        childChatId_parentChatId_direction: {
          childChatId,
          parentChatId,
          direction: ChatLinkDirection.DOWN,
        },
      },
      create: {
        userId,
        childChatId,
        parentChatId,
        direction: ChatLinkDirection.DOWN,
        includePrefix: true,
      },
      update: {},
    });
  }

  private async removeHierarchyLinks(childChatId: string, parentChatId: string) {
    await this.prisma.chatLink.deleteMany({
      where: {
        childChatId,
        parentChatId,
        direction: { in: [ChatLinkDirection.UP, ChatLinkDirection.DOWN] },
      },
    });
  }
}

export class ForbiddenFlowException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
