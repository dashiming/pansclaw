import { html, nothing } from "lit";
import type { AppViewState } from "../app-view-state.ts";
import {
  closeChatQuickApiKeyModal,
  saveChatQuickApiKey,
} from "../controllers/chat-quick-api-key.ts";

export function renderChatQuickApiKeyModal(state: AppViewState) {
  const modal = state.chatQuickApiKeyModal;
  if (!modal || !modal.open) {
    return nothing;
  }

  const isLoading = modal.saving;
  const keyValue = state.chatQuickApiKeyDraft ?? "";
  const canSave = keyValue.trim().length > 0 && !isLoading;

  return html`
    <style>
      .chat-quick-api-key-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }
      .chat-quick-api-key-modal {
        background: var(--bg-panel, #fff);
        border-radius: 8px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
      }
      .chat-quick-api-key-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
      }
      .chat-quick-api-key-modal-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--color-text, #000);
      }
      .chat-quick-api-key-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--color-text-secondary, #666);
        padding: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }
      .chat-quick-api-key-modal-close:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
        color: var(--color-text, #000);
      }
      .chat-quick-api-key-modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }
      .chat-quick-api-key-modal-body p {
        margin: 0 0 16px 0;
        font-size: 15px;
        color: var(--color-text-secondary, #666);
        line-height: 1.6;
      }
      .chat-quick-api-key-modal-field {
        margin-bottom: 20px;
      }
      .chat-quick-api-key-modal-field label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
        font-size: 14px;
        color: var(--color-text, #000);
      }
      .chat-quick-api-key-modal-field input {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border-color, #d0d0d0);
        border-radius: 4px;
        font-size: 14px;
        font-family: monospace;
        box-sizing: border-box;
        background: var(--bg-input, #fff);
        color: var(--color-text, #000);
        transition: border-color 0.2s;
      }
      .chat-quick-api-key-modal-field input:focus {
        outline: none;
        border-color: var(--color-accent, #0066cc);
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }
      .chat-quick-api-key-modal-field input:disabled {
        background: var(--bg-disabled, #f5f5f5);
        color: var(--color-text-disabled, #999);
      }
      .chat-quick-api-key-modal-error {
        background: rgba(209, 67, 67, 0.1);
        border: 1px solid rgb(209, 67, 67);
        border-radius: 4px;
        padding: 12px 14px;
        font-size: 13px;
        color: rgb(209, 67, 67);
        margin-bottom: 16px;
      }
      .chat-quick-api-key-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid var(--border-color, #e0e0e0);
        background: var(--bg-secondary, #fafafa);
      }
      .chat-quick-api-key-modal-btn {
        padding: 10px 18px;
        border-radius: 4px;
        border: 1px solid var(--border-color, #d0d0d0);
        background: var(--bg-button, #fff);
        color: var(--color-text, #000);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .chat-quick-api-key-modal-btn:hover:not(:disabled) {
        background: var(--bg-button-hover, #f0f0f0);
        border-color: var(--border-color-hover, #999);
      }
      .chat-quick-api-key-modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .chat-quick-api-key-modal-btn-primary {
        background: var(--color-accent, #0066cc);
        color: #fff;
        border-color: var(--color-accent, #0066cc);
      }
      .chat-quick-api-key-modal-btn-primary:hover:not(:disabled) {
        background: var(--color-accent-hover, #0052a3);
        border-color: var(--color-accent-hover, #0052a3);
      }
    </style>
    <div class="chat-quick-api-key-modal-overlay" @click=${() => handleCancel(state)}>
      <div class="chat-quick-api-key-modal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="chat-quick-api-key-modal-header">
          <h2 class="chat-quick-api-key-modal-title">API Key Required</h2>
          <button
            class="chat-quick-api-key-modal-close"
            type="button"
            ?disabled=${isLoading}
            @click=${() => handleCancel(state)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div class="chat-quick-api-key-modal-body">
          <p>The model you selected requires an API key for <strong>${modal.label}</strong>.</p>
          <p style="margin-bottom: 20px; font-size: 13px; color: var(--color-text-secondary, #666);">
            Enter your API key below to continue using this model for chat.
          </p>
          <div class="chat-quick-api-key-modal-field">
            <label>API Key</label>
            <input
              type="password"
              placeholder="Paste your API key here"
              .value=${keyValue}
              ?disabled=${isLoading}
              @input=${(e: Event) => {
                state.chatQuickApiKeyDraft = (e.target as HTMLInputElement).value;
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && canSave) {
                  e.preventDefault();
                  void handleSaveAndContinue(state, modal.provider);
                }
              }}
              autofocus
            />
          </div>
          ${
            modal.error
              ? html`<div class="chat-quick-api-key-modal-error">${modal.error}</div>`
              : nothing
          }
        </div>
        <div class="chat-quick-api-key-modal-footer">
          <button
            class="chat-quick-api-key-modal-btn"
            type="button"
            ?disabled=${isLoading}
            @click=${() => handleCancel(state)}
          >
            Cancel
          </button>
          <button
            class="chat-quick-api-key-modal-btn chat-quick-api-key-modal-btn-primary"
            type="button"
            ?disabled=${!canSave}
            @click=${() => {
              void handleSaveAndContinue(state, modal.provider);
            }}
          >
            ${isLoading ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  `;
}

function handleCancel(state: AppViewState) {
  const modelSelect = document.querySelector<HTMLSelectElement>(
    'select[data-chat-model-select="true"]',
  );
  if (modelSelect) {
    const currentOverride = state.chatModelOverrides[state.sessionKey];
    const activeRow = state.sessionsResult?.sessions?.find((row) => row.key === state.sessionKey);
    const previousModel = currentOverride ?? (activeRow?.model || "");
    modelSelect.value = previousModel;
  }
  closeChatQuickApiKeyModal(state);
}

async function handleSaveAndContinue(state: AppViewState, provider: string) {
  const modal = state.chatQuickApiKeyModal;
  if (!modal || !state.chatQuickApiKeyDraft) {
    return;
  }

  await saveChatQuickApiKey(state, provider, state.chatQuickApiKeyDraft);
}
