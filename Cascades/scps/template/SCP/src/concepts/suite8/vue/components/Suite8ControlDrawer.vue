<script setup lang="ts">
/**
 * Suite8ControlDrawer — V-3 · THE TOOLBAR BREAKOUT · THE SUITE 8 CONTROL DRAWER (DUPP · viridian voice)
 *
 * A right-anchored drop-up drawer cloned from ScsBridgeSessionsPopup (the DUPP recipe: Teleport
 * to body · Transition · fixed-inset backdrop z-60 · panel bottom:4rem · height min(600px,
 * calc(100vh - 8rem)) · flex column · header/body/footer · ESC + backdrop + ✕ close). Viridian
 * voice: a border-left viridian rule (Suite 8's Green). Header: fa-diagram-project · 'SUITE 8
 * CONTROL' + a hifi-mono eyebrow of the designation.
 *
 * Body: <Suite8Control :suite8-name="designation" :worked="true" :no-scp-section="true" /> — the
 * ONE canonical control, mounted WORKED (the Entourage Forge boots collapsed) and with §II (the
 * SCPs drawer) suppressed (:no-scp-section) since the toolbar already carries the dedicated SCP
 * Management drawer beside this one — no duplicate SCP helm.
 *
 * Emits 'close'. Prop: { designation: string } (the current page's Suite 8 designation · the
 * IslandWrapper null-guards the mount, so designation is always a live string here).
 *
 * Citation: ScsBridgeSessionsPopup.vue (the DUPP recipe VERBATIM) · Suite8Control.vue (the mounted
 * control · the noScpSection opt-out) · style.css ~:252-264 (the 4px body scrollbar recipe).
 */
import { onMounted, onUnmounted } from 'vue';
import Suite8Control from './Suite8Control.vue';

interface Props {
  designation: string;
}

defineProps<Props>();

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
    <Transition name="s8-control-drawer">
      <div
        class="s8-control-drawer-backdrop"
        @click="handleClose"
      >
        <div
          class="s8-control-drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Suite 8 Control"
          @click.stop
        >
          <div class="s8-control-drawer-header">
            <div class="s8-control-drawer-header-identity">
              <i class="fa-solid fa-diagram-project s8-control-drawer-icon" aria-hidden="true"></i>
              <span class="s8-control-drawer-title">SUITE 8 CONTROL</span>
              <span class="s8-control-drawer-eyebrow hifi-mono">{{ designation }}</span>
            </div>
            <button
              class="s8-control-drawer-close"
              aria-label="Close Suite 8 control"
              title="Close"
              @click="handleClose"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </div>

          <div class="s8-control-drawer-body">
            <Suite8Control :suite8-name="designation" :worked="true" :no-scp-section="true" />
          </div>

          <div class="s8-control-drawer-footer">
            <span>Suite 8 Control · Quick-Access Drawer</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.s8-control-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: auto;
}

.s8-control-drawer-panel {
  /* V-3 · RIGHT-ANCHORED drop-up. width:560px · right:24px · left:auto. The DEFINITE-HEIGHT LAW
     (a flex body inside a max-height-only panel collapses to zero): height: min(...) gives the
     flex chain its definite height while clamping to the viewport. */
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

  /* Viridian voice — Suite 8's Green border-left rule. */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 2px solid var(--color-viridian, #40826d);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(64, 130, 109, 0.08);
}

.s8-control-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(
    180deg,
    rgba(64, 130, 109, 0.06) 0%,
    transparent 100%
  );
  flex-shrink: 0;
}

.s8-control-drawer-header-identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.s8-control-drawer-icon {
  font-size: 0.875rem;
  color: var(--color-viridian, #40826d);
}

.s8-control-drawer-title {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
  text-shadow: 0.5px 0.5px 0 rgba(246, 175, 59, 0.7);
}

.s8-control-drawer-eyebrow {
  font-size: 0.625rem;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
  margin-left: 0.4rem;
}

.s8-control-drawer-close {
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

.s8-control-drawer-close:hover {
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.04);
}

.s8-control-drawer-body {
  /* THE 4px SCROLLBAR RECIPE (ScsBridgeSessionsPopup ~:252-264) — the drawer body owns the
     scroll (overflow-y:auto); the Control's own sections flow within. */
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem;
}

.s8-control-drawer-body::-webkit-scrollbar {
  width: 4px;
}
.s8-control-drawer-body::-webkit-scrollbar-track {
  background: transparent;
}
.s8-control-drawer-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.s8-control-drawer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.s8-control-drawer-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.5625rem;
  color: #ffffff;
  text-shadow: 0 0 7px rgba(255, 255, 255, 0.38);
  font-style: italic;
  flex-shrink: 0;
}

.s8-control-drawer-enter-active {
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}
.s8-control-drawer-leave-active {
  transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}
.s8-control-drawer-enter-from,
.s8-control-drawer-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
