import * as path from 'node:path';
import * as fs from 'node:fs';
import { Tray, Menu, nativeImage, app } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { sessionRegistry } from './session-registry';

let trayInstance: Tray | null = null;

function resolveTrayIconPath(appPath: string): string {
  const candidates = [
    path.join(appPath, 'assets', 'tray-icon.png'),
    path.join(appPath, '..', 'assets', 'tray-icon.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

function resolveDockIconPath(appPath: string): string {
  const candidates = [
    path.join(appPath, 'assets', 'scs-badge.png'),
    path.join(appPath, '..', 'assets', 'scs-badge.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

function buildTrayImage(iconPath: string) {
  if (fs.existsSync(iconPath)) {
    const img = nativeImage.createFromPath(iconPath);
    if (process.platform === 'darwin') {
      img.setTemplateImage(true);
    }
    return img;
  }
  return nativeImage.createEmpty();
}

function applyDockIcon(appPath: string): void {
  if (process.platform !== 'darwin') return;
  if (!app.dock) return;
  const dockIconPath = resolveDockIconPath(appPath);
  if (!fs.existsSync(dockIconPath)) return;
  try {
    app.dock.setIcon(dockIconPath);
  } catch {
    // Non-fatal: tray still works without dock icon
  }
}

export interface TrayContext {
  onQuit: () => void;
  onNewSession: () => void;
}

export function createTray(ctx: TrayContext): Tray {
  if (trayInstance) return trayInstance;
  const appPath = app.getAppPath();
  const iconPath = resolveTrayIconPath(appPath);
  const image = buildTrayImage(iconPath);
  applyDockIcon(appPath);
  const tray = new Tray(image);
  tray.setToolTip('SCS Bridge');
  refreshTrayMenu(tray, ctx);
  tray.on('double-click', () => {
    const sessions = sessionRegistry.list();
    if (sessions.length > 0) {
      sessions[sessions.length - 1].show(true);
    } else {
      ctx.onNewSession();
    }
  });
  trayInstance = tray;
  return tray;
}

export function refreshTrayMenu(tray: Tray, ctx: TrayContext): void {
  const sessionIds = sessionRegistry.listIds();
  const sessionItems: MenuItemConstructorOptions[] = sessionIds.map((id) => ({
    label: id,
    click: () => {
      const session = sessionRegistry.get(id);
      if (session) session.show(true);
    },
  }));
  const template: MenuItemConstructorOptions[] = [
    {
      label: `SCS Bridge — ${sessionIds.length} session${sessionIds.length === 1 ? '' : 's'}`,
      enabled: false,
    },
    { type: 'separator' },
    ...(sessionItems.length > 0
      ? sessionItems
      : ([{ label: '(no sessions)', enabled: false }] as MenuItemConstructorOptions[])),
    { type: 'separator' },
    { label: 'New Session', click: () => ctx.onNewSession() },
    { type: 'separator' },
    { label: 'Quit SCS Bridge', click: () => ctx.onQuit() },
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

export function disposeTray(): void {
  if (trayInstance) {
    trayInstance.destroy();
    trayInstance = null;
  }
}
