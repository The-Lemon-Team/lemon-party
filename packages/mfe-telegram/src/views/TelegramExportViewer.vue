<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

// Types for Telegram Export Format
interface TelegramTextEntity {
  type: string;
  text: string;
  href?: string;
}

interface TelegramMessage {
  id: number;
  type: string;
  date: string;
  date_unixtime?: string;
  from?: string;
  from_id?: string;
  text: string | TelegramTextEntity[];
  text_entities?: TelegramTextEntity[];
  photo?: string;
  file?: string;
  media_type?: string;
  mime_type?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
}

interface TelegramChatExport {
  name: string;
  type: string;
  id: number;
  messages: TelegramMessage[];
}

// State
const chatData = ref<TelegramChatExport | null>(null);
const isLoading = ref(false);
const errorMsg = ref('');
const searchQuery = ref('');
const filterSender = ref('');
const selectedMessageIds = ref<Set<number>>(new Set());
const importStatus = ref<{ total: number; success: number; error: number } | null>(null);
const isImporting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileSelect() {
  fileInput.value?.click();
}

// Active navigation style checks (dark mode helper)
const isDarkMode = ref(false);

onMounted(() => {
  // Simple check for theme
  isDarkMode.value = document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark-theme') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
});

// Parse files
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  parseFile(file);
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  parseFile(file);
}

function parseFile(file: File) {
  isLoading.value = true;
  errorMsg.value = '';
  chatData.value = null;
  selectedMessageIds.value.clear();
  importStatus.value = null;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      
      if (!parsed.messages || !Array.isArray(parsed.messages)) {
        throw new Error('Некорректный формат экспорта Telegram. Отсутствует список сообщений.');
      }
      
      chatData.value = parsed as TelegramChatExport;
    } catch (err) {
      errorMsg.value = err instanceof Error ? err.message : 'Не удалось разобрать JSON файл';
    } finally {
      isLoading.value = false;
    }
  };
  reader.onerror = () => {
    errorMsg.value = 'Ошибка при чтении файла';
    isLoading.value = false;
  };
  reader.readAsText(file);
}

// Render utilities
function renderMessageText(text: string | TelegramTextEntity[]): string {
  if (typeof text === 'string') {
    // Escape HTML to prevent XSS
    return escapeHtml(text).replace(/\n/g, '<br>');
  }
  if (Array.isArray(text)) {
    return text.map(part => {
      if (typeof part === 'string') {
        return escapeHtml(part).replace(/\n/g, '<br>');
      }
      const escapedText = escapeHtml(part.text || '').replace(/\n/g, '<br>');
      if (part.type === 'bold') return `<strong>${escapedText}</strong>`;
      if (part.type === 'italic') return `<em>${escapedText}</em>`;
      if (part.type === 'underline') return `<u>${escapedText}</u>`;
      if (part.type === 'strikethrough') return `<s>${escapedText}</s>`;
      if (part.type === 'code') return `<code class="tg-code">${escapedText}</code>`;
      if (part.type === 'pre') return `<pre class="tg-pre"><code>${escapedText}</code></pre>`;
      if (part.type === 'link') return `<a href="${part.text}" target="_blank" class="tg-link">${escapedText}</a>`;
      if (part.type === 'text_link') return `<a href="${part.href}" target="_blank" class="tg-link">${escapedText}</a>`;
      if (part.type === 'hashtag') return `<span class="tg-tag">${escapedText}</span>`;
      if (part.type === 'mention') return `<span class="tg-mention">${escapedText}</span>`;
      return escapedText;
    }).join('');
  }
  return '';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Avatar color helper
function getAvatarColor(name?: string): string {
  if (!name) return '#a3a3a3';
  const colors = [
    '#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', 
    '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047', 
    '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#fb8c00', '#f4511e'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Date helpers
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

// Message filtering
const filteredMessages = computed(() => {
  if (!chatData.value) return [];
  return chatData.value.messages.filter(msg => {
    // Only regular messages with text content
    if (msg.type !== 'message') return false;
    
    const textStr = typeof msg.text === 'string' 
      ? msg.text 
      : msg.text.map(t => typeof t === 'string' ? t : t.text).join('');

    const matchesSearch = textStr.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesSender = !filterSender.value || msg.from === filterSender.value;
    
    return matchesSearch && matchesSender;
  });
});

// Senders list for filter dropdown
const senders = computed(() => {
  if (!chatData.value) return [];
  const set = new Set<string>();
  chatData.value.messages.forEach(msg => {
    if (msg.from) set.add(msg.from);
  });
  return Array.from(set).sort();
});

// Selection actions
const isAllSelected = computed(() => {
  return filteredMessages.value.length > 0 && 
         filteredMessages.value.every(msg => selectedMessageIds.value.has(msg.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    filteredMessages.value.forEach(msg => selectedMessageIds.value.delete(msg.id));
  } else {
    filteredMessages.value.forEach(msg => selectedMessageIds.value.add(msg.id));
  }
}

function toggleSelect(id: number) {
  if (selectedMessageIds.value.has(id)) {
    selectedMessageIds.value.delete(id);
  } else {
    selectedMessageIds.value.add(id);
  }
}

// Copy Selected to Clipboard
function copySelectedText() {
  if (selectedMessageIds.value.size === 0 || !chatData.value) return;
  
  const selectedMsgs = chatData.value.messages
    .filter(msg => selectedMessageIds.value.has(msg.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const formatted = selectedMsgs.map(msg => {
    const time = new Date(msg.date).toLocaleString();
    const textStr = typeof msg.text === 'string' 
      ? msg.text 
      : msg.text.map(t => typeof t === 'string' ? t : t.text).join('');
    return `[${time}] ${msg.from || 'Unknown'}: ${textStr}`;
  }).join('\n\n');

  navigator.clipboard.writeText(formatted).then(() => {
    alert(`Скопировано сообщений: ${selectedMsgs.length}`);
  }).catch(() => {
    alert('Не удалось скопировать в буфер обмена');
  });
}

// Import Selected into Lemon Party
async function importSelectedToLemonParty() {
  if (selectedMessageIds.value.size === 0 || !chatData.value) return;
  
  const token = localStorage.getItem('inspiration_token');
  if (!token) {
    alert('Ошибка: Вы не авторизованы в Lemon Party. Пожалуйста, выполните вход.');
    return;
  }

  const selectedMsgs = chatData.value.messages
    .filter(msg => selectedMessageIds.value.has(msg.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  isImporting.value = true;
  importStatus.value = { total: selectedMsgs.length, success: 0, error: 0 };

  for (const msg of selectedMsgs) {
    try {
      const textStr = typeof msg.text === 'string' 
        ? msg.text 
        : msg.text.map(t => typeof t === 'string' ? t : t.text).join('');
      
      const payloadText = `Узнал (из Telegram от ${msg.from || 'автора'} за ${new Date(msg.date).toLocaleDateString()}):\n - ${textStr}`;
      
      const res = await fetch('/api/entries/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rawText: payloadText,
          isPublic: false
        })
      });

      if (res.ok) {
        importStatus.value.success++;
      } else {
        importStatus.value.error++;
      }
    } catch {
      importStatus.value.error++;
    }
  }

  isImporting.value = false;
  selectedMessageIds.value.clear();
}
</script>

<template>
  <div class="mfe-tg-container">
    <div v-if="!chatData" class="upload-screen">
      <div 
        class="drop-zone"
        @dragover.prevent
        @drop="handleFileDrop"
        @click="triggerFileSelect"
      >
        <div class="drop-zone-content">
          <span class="material-symbols-outlined upload-icon">cloud_upload</span>
          <h3>Загрузите экспорт чата Telegram</h3>
          <p class="subtitle">Перетащите сюда файл <strong>result.json</strong> или нажмите для выбора</p>
          <input 
            ref="fileInput"
            type="file"
            accept=".json"
            class="file-input"
            @change="handleFileUpload"
          />
        </div>
      </div>
      
      <div v-if="isLoading" class="loader-overlay">
        <div class="loader-spinner"></div>
        <p>Анализ файла экспорта...</p>
      </div>

      <div v-if="errorMsg" class="error-banner">
        <span class="material-symbols-outlined error-icon">warning</span>
        <p>{{ errorMsg }}</p>
      </div>

      <div class="guide-card">
        <h4>Как получить result.json из Telegram?</h4>
        <ol>
          <li>Откройте Telegram Desktop и зайдите в нужный чат.</li>
          <li>Нажмите кнопку меню (три точки в правом углу) и выберите <strong>Экспорт истории чата</strong>.</li>
          <li>В появившемся окне снимите галочки со всех медиафайлов и выберите формат <strong>JSON</strong>.</li>
          <li>Нажмите <strong>Экспортировать</strong> и загрузите полученный файл `result.json` сюда.</li>
        </ol>
      </div>
    </div>

    <div v-else class="chat-viewer-screen">
      <!-- Top control header bar -->
      <header class="viewer-header">
        <div class="chat-info">
          <button class="back-btn" @click="chatData = null">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h3>{{ chatData.name }}</h3>
            <p class="subtitle">{{ chatData.type === 'personal_chat' ? 'Личный чат' : 'Групповой чат' }} • {{ chatData.messages.length }} сообщений</p>
          </div>
        </div>

        <div class="filters-bar">
          <div class="search-input-wrapper">
            <span class="material-symbols-outlined search-icon">search</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Поиск по сообщениям..." 
              class="search-input"
            />
          </div>

          <select v-model="filterSender" class="sender-select">
            <option value="">Все участники</option>
            <option v-for="sender in senders" :key="sender" :value="sender">{{ sender }}</option>
          </select>
        </div>
      </header>

      <!-- Selection action rail -->
      <div v-if="selectedMessageIds.size > 0 || importStatus" class="actions-rail">
        <div v-if="importStatus" class="import-status">
          <span class="material-symbols-outlined status-icon">info</span>
          <p>
            Импорт завершен: <strong>{{ importStatus.success }}</strong> успешно, 
            <strong>{{ importStatus.error }}</strong> с ошибкой (из {{ importStatus.total }}).
          </p>
          <button class="close-status-btn" @click="importStatus = null">Закрыть</button>
        </div>

        <div v-else class="selection-controls">
          <span class="selection-count">Выбрано сообщений: <strong>{{ selectedMessageIds.size }}</strong></span>
          <div class="action-buttons">
            <button class="action-btn action-btn--secondary" @click="copySelectedText">
              <span class="material-symbols-outlined">content_copy</span>
              Скопировать текст
            </button>
            <button class="action-btn action-btn--primary" :disabled="isImporting" @click="importSelectedToLemonParty">
              <span class="material-symbols-outlined">publish</span>
              {{ isImporting ? 'Импорт...' : 'Импортировать в Lemon Party' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Messages scroll panel -->
      <div class="messages-viewport">
        <div class="messages-container">
          <div class="bulk-header">
            <label class="select-all-label">
              <input 
                type="checkbox" 
                :checked="isAllSelected" 
                @change="toggleSelectAll"
              />
              Выбрать все отфильтрованные сообщения ({{ filteredMessages.length }})
            </label>
          </div>

          <div v-if="filteredMessages.length === 0" class="empty-results">
            <span class="material-symbols-outlined empty-icon">forum</span>
            <p>Нет сообщений, соответствующих критериям фильтрации</p>
          </div>

          <template v-else>
            <div v-for="(msg, index) in filteredMessages" :key="msg.id">
              <!-- Render date separator if day changed -->
              <div 
                v-if="index === 0 || groupDate(msg.date) !== groupDate(filteredMessages[index - 1].date)" 
                class="date-divider"
              >
                <span>{{ groupDate(msg.date) }}</span>
              </div>

              <!-- Message Row -->
              <div 
                class="message-row" 
                :class="{ 'message-row--selected': selectedMessageIds.has(msg.id) }"
                @click="toggleSelect(msg.id)"
              >
                <div class="message-select-box">
                  <input 
                    type="checkbox" 
                    :checked="selectedMessageIds.has(msg.id)"
                    @click.stop
                    @change="toggleSelect(msg.id)"
                  />
                </div>

                <div 
                  class="tg-avatar" 
                  :style="{ backgroundColor: getAvatarColor(msg.from) }"
                >
                  {{ getInitials(msg.from) }}
                </div>

                <div class="message-content-wrapper">
                  <div class="message-sender-meta">
                    <span class="sender-name">{{ msg.from || 'Unknown' }}</span>
                    <span class="message-time">{{ formatDate(msg.date) }}</span>
                  </div>

                  <div class="message-text-body" v-html="renderMessageText(msg.text)"></div>
                  
                  <!-- If message has attachment/media -->
                  <div v-if="msg.photo || msg.file" class="media-attachment">
                    <span class="material-symbols-outlined">attachment</span>
                    <span class="media-filename">{{ msg.photo || msg.file }}</span>
                    <span v-if="msg.media_type" class="media-badge">{{ msg.media_type }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mfe-tg-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--bg-primary, #1e1e24);
  color: var(--text-primary, #f0f0f5);
  font-family: 'Outfit', 'Inter', sans-serif;
  overflow: hidden;
}

/* Upload screen style */
.upload-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2rem;
  max-width: 700px;
  margin: 0 auto;
  gap: 2rem;
  overflow-y: auto;
}

.drop-zone {
  width: 100%;
  border: 2px dashed var(--border-color, rgba(255, 255, 255, 0.15));
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  padding: 4rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.drop-zone:hover {
  border-color: var(--accent-color, #7070ff);
  background: rgba(112, 112, 255, 0.05);
  transform: translateY(-2px);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 4rem;
  color: var(--accent-color, #7070ff);
  animation: pulse 2s infinite;
}

.subtitle {
  color: var(--text-muted, #a0a0b0);
  font-size: 0.95rem;
}

.file-input {
  display: none;
}

.guide-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.guide-card h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: var(--accent-color, #7070ff);
}

.guide-card ol {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text-secondary, #d0d0e0);
  font-size: 0.9rem;
  line-height: 1.6;
}

.guide-card li {
  margin-bottom: 0.5rem;
}

/* Loader spinner */
.loader-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-color, #7070ff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Error banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(239, 83, 80, 0.15);
  border: 1px solid rgba(239, 83, 80, 0.3);
  color: #ef5350;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  width: 100%;
}

.error-icon {
  font-size: 1.5rem;
}

/* Chat Viewer Screen */
.chat-viewer-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.viewer-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
  background: rgba(255, 255, 255, 0.01);
  gap: 1rem;
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-info h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary, #d0d0e0);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary, #ffffff);
}

.filters-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-grow: 1;
  max-width: 500px;
}

.search-input-wrapper {
  position: relative;
  flex-grow: 1;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted, #7a7a8a);
  font-size: 1.2rem;
}

.search-input {
  width: 100%;
  padding: 0.5rem 1rem 0.5rem 2.2rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--accent-color, #7070ff);
}

.sender-select {
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  max-width: 180px;
}

/* Actions Rail */
.actions-rail {
  padding: 0.75rem 1.5rem;
  background: rgba(112, 112, 255, 0.08);
  border-bottom: 1px solid rgba(112, 112, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.selection-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn--primary {
  background: var(--accent-color, #7070ff);
  color: #fff;
}

.action-btn--primary:hover {
  background: #5c5cff;
}

.action-btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn--secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary, #fff);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn--secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.import-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.status-icon {
  color: var(--accent-color, #7070ff);
}

.close-status-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary, #fff);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

/* Messages Viewport */
.messages-viewport {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  background: radial-gradient(circle at center, rgba(112, 112, 255, 0.03), transparent);
}

.messages-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bulk-header {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.01);
  border-radius: 6px;
}

.select-all-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #d0d0e0);
  cursor: pointer;
}

.date-divider {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.date-divider span {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  padding: 0.35rem 0.85rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted, #a0a0b0);
}

.message-row {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  transition: background 0.2s, transform 0.2s;
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.message-row:hover {
  background: rgba(255, 255, 255, 0.03);
  transform: translateX(2px);
}

.message-row--selected {
  background: rgba(112, 112, 255, 0.08) !important;
  border-color: rgba(112, 112, 255, 0.2);
}

.message-select-box {
  display: flex;
  align-items: center;
}

.tg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-grow: 1;
}

.message-sender-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.sender-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--accent-color, #7070ff);
}

.message-time {
  font-size: 0.75rem;
  color: var(--text-muted, #7a7a8a);
}

.message-text-body {
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
  color: var(--text-primary, #f0f0f5);
}

.tg-code {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #fb8c00;
}

.tg-pre {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.75rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
  margin: 0.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tg-link {
  color: var(--accent-color, #7070ff);
  text-decoration: none;
}

.tg-link:hover {
  text-decoration: underline;
}

.tg-tag {
  color: #00acc1;
  font-weight: 500;
}

.tg-mention {
  color: #8e24aa;
  font-weight: 500;
}

.media-attachment {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
  max-width: fit-content;
}

.media-filename {
  color: var(--text-secondary, #d0d0e0);
  font-weight: 500;
}

.media-badge {
  background: rgba(112, 112, 255, 0.2);
  color: var(--accent-color, #7070ff);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: var(--text-muted, #7a7a8a);
  gap: 1rem;
}

.empty-icon {
  font-size: 3rem;
}

/* Keyframes and animations */
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
