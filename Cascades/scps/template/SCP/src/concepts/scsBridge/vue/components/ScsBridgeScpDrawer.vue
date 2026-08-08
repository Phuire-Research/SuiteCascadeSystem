<script setup lang="ts">
/**
 * ScsBridgeScpDrawer — V-3 · THE TOOLBAR BREAKOUT · THE SCP MANAGEMENT DRAWER (DUPP · cobalt voice)
 *
 * A right-anchored drop-up drawer cloned from ScsBridgeSessionsPopup (the DUPP recipe: Teleport
 * to body · Transition · fixed-inset backdrop z-60 · panel bottom:4rem · height min(600px,
 * calc(100vh - 8rem)) · flex column · header/body/footer · ESC + backdrop + ✕ close). Right-
 * anchored (right:24px · width:560px · left:auto) — the SCP helm quick-access, riding beside the
 * Sessions popup. Cobalt voice: a border-left cobalt rule + the pewter text-token relay on the body
 * (the Suite8Control §II SCP-backing precedent).
 *
 * Body: <ScpManagementPanel compact /> — the SAME full helm the Suite 8 Control drawer mounts
 * (Spawn/Focus/Exit/Multiply/Delete + the boot/multiply bars + ONLINE/OFFLINE grouping), compact
 * (no W1 footer · no "SCP MANAGEMENT →" nav button).
 *
 * Close paths: backdrop @click · ESC keydown · ✕ button · panel @click.stop blocks bubble-up.
 * Emits 'close'.
 *
 * Citation: ScsBridgeSessionsPopup.vue (the DUPP recipe VERBATIM) · Suite8Control.vue §II
 * (ScpManagementPanel compact mount · the s8c-scp-backing cobalt + pewter-token relay).
 */
import { inject, onMounted, onUnmounted } from 'vue';
import ScpManagementPanel from './ScpManagementPanel.vue';
import { BRIDGE_STATUS_COLORS } from '../../scsBridge.type';
import { SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';

interface Props {
  isOpen: boolean;
}

defineProps<Props>();

// Direct inject for the BRIDGE badge (the ScsBridgeSessionsPopup precedent — Teleport does not
// break Vue inject; the direct inject surfaces bridgeActive without an embedded relay).
const controller = inject(SCS_BRIDGE_CONTROLLER_KEY);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function handleClose() {
  emit('close');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="scp-drawer">
      <div
        v-if="isOpen"
        class="scp-drawer-backdrop"
        @click="handleClose"
      >
        <div
          class="scp-drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-label="SCP Management"
          @click.stop
        >
          <div class="scp-drawer-header">
            <div class="scp-drawer-header-identity">
              <i class="fa-solid fa-cube scp-drawer-icon" aria-hidden="true"></i>
              <span class="scp-drawer-title">SCP MANAGEMENT</span>
              <span
                class="scp-drawer-bridge-active"
                :style="{
                  color: (controller?.connectionEstablished.value ?? false)
                    ? BRIDGE_STATUS_COLORS.connected
                    : BRIDGE_STATUS_COLORS.error,
                }"
              >
                BRIDGE {{ (controller?.connectionEstablished.value ?? false) ? 'CONNECTED' : 'PENDING' }}
              </span>
            </div>
            <button
              class="scp-drawer-close"
              aria-label="Close SCP management"
              title="Close"
              @click="handleClose"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div class="scp-drawer-body">
            <ScpManagementPanel compact />
          </div>

          <div class="scp-drawer-footer">
            <span>SCP Management · Quick-Access Drawer</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.scp-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: auto;
}

.scp-drawer-panel {
  /* V-3 · RIGHT-ANCHORED (vs the Sessions popup's sidebar-anchored split): the drawer hugs the
     right edge beside the bridge controls. width:560px · right:24px · left:auto. The DEFINITE-
     HEIGHT LAW (a flex body inside a max-height-only panel collapses to zero): height: min(...)
     gives the flex chain its definite height while clamping to the viewport. */
  position: fixed;
  right: 24px;
  left: auto;
  bottom: 4rem;
  width: 560px;
  max-width: none;
  height: min(600px, calc(100vh - 8rem));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 0.75rem;

  background: linear-gradient(
    180deg,
    rgba(8, 12, 20, 0.98) 0%,
    rgba(4, 6, 12, 0.99) 100%
  );

  /* Cobalt voice — the border-left cobalt rule (the Suite8Control §II SCP-backing signature). */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 2px solid var(--color-cobalt, #3b82f6);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(37, 99, 235, 0.08);
}

.scp-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(
    180deg,
    rgba(37, 99, 235, 0.06) 0%,
    transparent 100%
  );
  flex-shrink: 0;
}

.scp-drawer-header-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scp-drawer-icon {
  font-size: 0.875rem;
  color: var(--color-cobalt, #3b82f6);
}

.scp-drawer-title {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
}

.scp-drawer-bridge-active {
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-left: 0.5rem;
  padding: 2px 6px;
  border: 1px solid currentColor;
  border-radius: 3px;
}

.scp-drawer-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.15s ease;
  line-height: 1;
  border-radius: 4px;
}

.scp-drawer-close:hover {
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.04);
}

.scp-drawer-body {
  /* THE PEWTER TOKEN RELAY (the s8c-scp-backing precedent · style.css ~:1705-1720) — the panel's
     own chrome consumes these two text tokens; defined here so the compact mount's text glow +
     recede resolve inside the drawer vessel. The body owns the scroll (the 4px recipe). */
  --pewter-text-glow: 1px 1px 2px rgba(255, 255, 255, 0.45);
  --pewter-text-recede: rgba(255, 255, 255, 0.42);
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem;
}

.scp-drawer-body::-webkit-scrollbar {
  width: 4px;
}
.scp-drawer-body::-webkit-scrollbar-track {
  background: transparent;
}
.scp-drawer-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.scp-drawer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.scp-drawer-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.5625rem;
  color: #ffffff;
  text-shadow: 0 0 7px rgba(255, 255, 255, 0.38);
  font-style: italic;
  flex-shrink: 0;
}

.scp-drawer-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}
.scp-drawer-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
.scp-drawer-enter-from,
.scp-drawer-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
