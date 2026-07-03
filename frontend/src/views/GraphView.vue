<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { chatsApi } from '@/api/chats';
import GraphNodePanel from '@/components/graph/GraphNodePanel.vue';
import { useChatsStore } from '@/stores/chats';
import type { Chat, UpwardGrant } from '@/types';

type NodePoint = {
  chat: Chat;
  x: number;
  y: number;
};

type GraphEdge = {
  id: string;
  kind: 'parent' | 'grant';
  sourceId: string;
  targetId: string;
  source: NodePoint;
  target: NodePoint;
};

const GRAPH_WIDTH = 840;
const GRAPH_HEIGHT = 560;
const POSITIONS_KEY = 'lemon-party:graph-positions';
const DRAG_THRESHOLD = 5;

const chats = useChatsStore();
const grants = ref<UpwardGrant[]>([]);
const busy = ref(false);
const error = ref('');
const editMode = ref(false);
const connectMode = ref<'parent' | 'grant'>('parent');
const pendingSource = ref<Chat | null>(null);
const selectedEdgeId = ref<string | null>(null);
const selectedChatId = ref<string | null>(null);
const graphStageRef = ref<HTMLElement | null>(null);
const positions = ref<Record<string, { x: number; y: number }>>({});
const draggingChatId = ref<string | null>(null);

const dragState = ref<{
  chatId: string;
  startClientX: number;
  startClientY: number;
  moved: boolean;
} | null>(null);

function loadStoredPositions() {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (raw) positions.value = JSON.parse(raw) as Record<string, { x: number; y: number }>;
  } catch {
    positions.value = {};
  }
}

function savePositions() {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions.value));
}

function resetLayout() {
  positions.value = {};
  localStorage.removeItem(POSITIONS_KEY);
}

function computeAutoPosition(chat: Chat, index: number, regularCount: number) {
  if (chat.kind === 'GENERAL') {
    return { x: GRAPH_WIDTH / 2, y: 50 };
  }

  const radiusX = Math.max(280, regularCount * 42);
  const radiusY = Math.max(160, regularCount * 24);
  const angle = (Math.PI * 2 * index) / Math.max(regularCount, 1) - Math.PI / 2;
  return {
    x: GRAPH_WIDTH / 2 + Math.cos(angle) * radiusX,
    y: 300 + Math.sin(angle) * radiusY,
  };
}

function clientToGraph(clientX: number, clientY: number) {
  const stage = graphStageRef.value;
  if (!stage) return { x: 0, y: 0 };

  const rect = stage.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * GRAPH_WIDTH,
    y: ((clientY - rect.top) / rect.height) * GRAPH_HEIGHT,
  };
}

const nodes = computed<NodePoint[]>(() => {
  const all = chats.allChats;
  if (all.length === 0) return [];

  const general = all.find((chat) => chat.kind === 'GENERAL') ?? null;
  const regular = all.filter((chat) => chat.kind !== 'GENERAL');

  const points: NodePoint[] = [];
  if (general) {
    const saved = positions.value[general.id];
    points.push({
      chat: general,
      ...(saved ?? computeAutoPosition(general, 0, regular.length)),
    });
  }

  regular.forEach((chat, index) => {
    const saved = positions.value[chat.id];
    points.push({
      chat,
      ...(saved ?? computeAutoPosition(chat, index, regular.length)),
    });
  });

  return points;
});

const pointByChatId = computed(
  () => new Map(nodes.value.map((point) => [point.chat.id, point] as const)),
);

const graphEdges = computed<GraphEdge[]>(() => {
  const hierarchy = nodes.value
    .filter((point) => point.chat.parentChatId)
    .map((point) => {
      const source = pointByChatId.value.get(point.chat.id);
      const target = pointByChatId.value.get(point.chat.parentChatId!);
      if (!source || !target) return null;
      return {
        id: `parent:${point.chat.id}->${point.chat.parentChatId}`,
        kind: 'parent' as const,
        sourceId: source.chat.id,
        targetId: target.chat.id,
        source,
        target,
      };
    })
    .filter((edge) => Boolean(edge)) as GraphEdge[];

  const grantEdges = grants.value
    .map((grant) => {
      const source = pointByChatId.value.get(grant.fromChatId);
      const target = pointByChatId.value.get(grant.toChatId);
      if (!source || !target) return null;
      return {
        id: `grant:${grant.id}`,
        kind: 'grant' as const,
        sourceId: source.chat.id,
        targetId: target.chat.id,
        source,
        target,
      };
    })
    .filter((edge) => Boolean(edge)) as GraphEdge[];

  return [...hierarchy, ...grantEdges];
});

const selectedEdge = computed(() =>
  graphEdges.value.find((edge) => edge.id === selectedEdgeId.value) ?? null,
);

const selectedChat = computed(
  () => chats.allChats.find((chat) => chat.id === selectedChatId.value) ?? null,
);

function selectChat(chatId: string) {
  selectedChatId.value = chatId;
}

async function loadGraph() {
  busy.value = true;
  error.value = '';
  try {
    await chats.load(true);
    grants.value = await chatsApi.getUpwardGrants();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить граф';
  } finally {
    busy.value = false;
  }
}

function resetComposer() {
  pendingSource.value = null;
}

function onNodeClick(chat: Chat) {
  if (!editMode.value) return;

  if (!pendingSource.value) {
    pendingSource.value = chat;
    return;
  }

  if (pendingSource.value.id === chat.id) {
    resetComposer();
    return;
  }

  void connectNodes(pendingSource.value, chat);
}

function onNodePointerDown(event: PointerEvent, chat: Chat) {
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  dragState.value = {
    chatId: chat.id,
    startClientX: event.clientX,
    startClientY: event.clientY,
    moved: false,
  };
}

function onNodePointerMove(event: PointerEvent) {
  if (!dragState.value) return;

  const dx = event.clientX - dragState.value.startClientX;
  const dy = event.clientY - dragState.value.startClientY;
  if (!dragState.value.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

  dragState.value.moved = true;
  draggingChatId.value = dragState.value.chatId;
  const { x, y } = clientToGraph(event.clientX, event.clientY);
  positions.value = {
    ...positions.value,
    [dragState.value.chatId]: {
      x: Math.max(65, Math.min(GRAPH_WIDTH - 65, x)),
      y: Math.max(40, Math.min(GRAPH_HEIGHT - 40, y)),
    },
  };
}

function onNodePointerUp(_event: PointerEvent, chat: Chat) {
  if (!dragState.value) return;

  const wasDrag = dragState.value.moved;
  dragState.value = null;
  draggingChatId.value = null;

  if (wasDrag) {
    savePositions();
    return;
  }

  if (editMode.value) {
    onNodeClick(chat);
    return;
  }

  selectChat(chat.id);
}

async function connectNodes(source: Chat, target: Chat) {
  busy.value = true;
  error.value = '';
  try {
    if (connectMode.value === 'parent') {
      if (source.kind === 'GENERAL') {
        throw new Error('general не может быть дочерним в иерархии');
      }
      await chatsApi.setParent(source.id, target.id);
    } else {
      await chatsApi.createUpwardGrant(source.id, target.id);
    }
    await loadGraph();
    resetComposer();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось создать связь';
  } finally {
    busy.value = false;
  }
}

async function deleteSelectedEdge() {
  if (!selectedEdge.value) return;

  busy.value = true;
  error.value = '';
  try {
    if (selectedEdge.value.kind === 'parent') {
      await chatsApi.setParent(selectedEdge.value.sourceId, null);
    } else {
      const grantId = selectedEdge.value.id.split(':')[1];
      await chatsApi.deleteUpwardGrant(grantId);
    }
    selectedEdgeId.value = null;
    await loadGraph();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось удалить связь';
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  loadStoredPositions();
  void loadGraph();
});
</script>

<template>
  <section class="page page--graph">
    <div class="graph-workspace">
      <header class="graph-workspace__toolbar">
        <h2 class="graph-workspace__title">Graph</h2>
        <button type="button" class="btn-secondary" @click="resetLayout">
          Сбросить раскладку
        </button>
        <button type="button" class="btn-secondary" @click="editMode = !editMode">
          {{ editMode ? 'Готово' : 'Связи' }}
        </button>
        <select v-if="editMode" v-model="connectMode" class="graph-workspace__select">
          <option value="parent">parent-child</option>
          <option value="grant">upward grant</option>
        </select>
        <button
          v-if="editMode && selectedEdge"
          type="button"
          class="btn-secondary"
          :disabled="busy"
          @click="deleteSelectedEdge"
        >
          Удалить связь
        </button>
        <button
          v-if="editMode && pendingSource"
          type="button"
          class="btn-secondary"
          @click="resetComposer"
        >
          Сбросить выбор
        </button>
        <p v-if="editMode" class="graph-workspace__hint caption">
          Клик: исходный → целевой. parent-child: исходный = дочерний.
        </p>
        <p v-if="pendingSource" class="graph-workspace__hint caption">
          Исходный: <strong>{{ pendingSource.name }}</strong>
        </p>
        <p v-if="error" class="graph-workspace__error">{{ error }}</p>
      </header>

      <div ref="graphStageRef" class="graph-stage graph-stage--fullscreen">
        <svg
          class="graph-stage__svg"
          :viewBox="`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="graphArrow"
              markerWidth="8"
              markerHeight="8"
              refX="6.5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L7,3 L0,6 Z" fill="#8b7cf8" />
            </marker>
          </defs>

          <line
            v-for="edge in graphEdges"
            :key="edge.id"
            :x1="edge.source.x"
            :y1="edge.source.y"
            :x2="edge.target.x"
            :y2="edge.target.y"
            class="graph-stage__edge"
            :class="{
              'graph-stage__edge--grant': edge.kind === 'grant',
              'graph-stage__edge--selected': edge.id === selectedEdgeId,
            }"
            marker-end="url(#graphArrow)"
            @click.stop="editMode ? (selectedEdgeId = edge.id) : null"
          />
        </svg>

        <div
          v-for="point in nodes"
          :key="point.chat.id"
          class="graph-node"
          :class="{
            'graph-node--general': point.chat.kind === 'GENERAL',
            'graph-node--child': point.chat.parentChatId,
            'graph-node--pending': pendingSource?.id === point.chat.id,
            'graph-node--selected': selectedChatId === point.chat.id,
            'graph-node--dragging': draggingChatId === point.chat.id,
          }"
          :style="{
            left: `${(point.x / GRAPH_WIDTH) * 100}%`,
            top: `${(point.y / GRAPH_HEIGHT) * 100}%`,
          }"
          role="button"
          tabindex="0"
          @pointerdown="onNodePointerDown($event, point.chat)"
          @pointermove="onNodePointerMove"
          @pointerup="onNodePointerUp($event, point.chat)"
          @pointercancel="onNodePointerUp($event, point.chat)"
          @keydown.enter.prevent="selectChat(point.chat.id)"
        >
          <span class="graph-node__title">{{ point.chat.name }}</span>
          <span class="graph-node__meta">
            {{ point.chat.parentChatId ? 'дочерний' : 'самостоятельный' }}
          </span>
        </div>
      </div>

      <GraphNodePanel
        v-if="selectedChat"
        :chat="selectedChat"
        :grants="grants"
        @close="selectedChatId = null"
        @updated="loadGraph"
        @select-chat="selectChat"
      />
    </div>
  </section>
</template>
