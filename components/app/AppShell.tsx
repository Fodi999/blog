'use client';

/**
 * AppShell — full-viewport workspace for /[locale]/app/*.
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ AppTopBar (h-14)                                             │
 *   ├──────────┬──────────────────────────┬────────────────────────┤
 *   │ Sidebar  │ Main workspace           │ Copilot                │
 *   │ 260/72   │ minmax(0,1fr)            │ 420/56                 │
 *   └──────────┴──────────────────────────┴────────────────────────┘
 *
 * Why `fixed inset-0`?
 * The parent locale layout wraps every route in
 * `<main className="container mx-auto px-4 py-8">`. For marketing pages
 * that's perfect; for the SaaS workspace it caps the width and adds outer
 * padding. We break out of that by positioning the shell as a viewport
 * overlay — the public Header / Footer are already hidden by
 * `<ChromeGate />`, so nothing competes for space.
 *
 * Sidebar collapse and Copilot collapse are both stored on the shared
 * `CopilotProvider`, so any page can toggle them too (e.g. auto-collapse
 * the left rail when the laboratory needs the screen).
 */
import { Sidebar } from './Sidebar';
import { MobileAppNav } from './MobileAppNav';
import { AppTopBar } from './AppTopBar';
import {
  CopilotProvider,
  useCopilot,
} from '@/components/copilot/CopilotProvider';
import { WorkspaceCommandsProvider } from '@/components/workspace/WorkspaceCommands';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
import { usePathname } from '@/i18n/routing';

const SIDEBAR_W = 260;
const SIDEBAR_W_COLLAPSED = 72;
const COPILOT_W = 420;
const COPILOT_W_COLLAPSED = 56;

function ShellGrid({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, collapsed: copilotCollapsed } = useCopilot();
  const sidebarW = sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;
  const copilotW = copilotCollapsed ? COPILOT_W_COLLAPSED : COPILOT_W;
  const pathname = usePathname();
  // Routes that take over the whole main area: no Copilot column,
  // no main padding. The page renders its own chrome.
  const fullscreenGame = pathname.startsWith('/app/kitchen-tycoon');

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col bg-muted/30"
      style={{
        // Expose collapse widths to descendants that need to align with
        // the grid (e.g. fullscreen-expanded Copilot).
        ['--app-sidebar-w' as string]: `${sidebarW}px`,
        ['--app-copilot-w' as string]: `${copilotW}px`,
      }}
    >
      <AppTopBar locale={locale} />

      {/* Desktop ≥ xl: 3 cols. lg→xl: 2 cols. < lg: 1 col (Copilot/Sidebar hidden). */}
      <div className="chefos-shell-grid grid min-h-0 flex-1">
        <style>{`
          .chefos-shell-grid { grid-template-columns: minmax(0,1fr); }
          @media (min-width: 1024px) {
            .chefos-shell-grid { grid-template-columns: ${sidebarW}px minmax(0,1fr); }
          }
          @media (min-width: 1280px) {
            .chefos-shell-grid { grid-template-columns: ${sidebarW}px minmax(0,1fr)${fullscreenGame ? '' : ` ${copilotW}px`}; }
          }
        `}</style>
        <Sidebar locale={locale} className="hidden lg:flex" />
        <main className="min-w-0 overflow-y-auto">
          {fullscreenGame ? (
            <div className="h-full">{children}</div>
          ) : (
            <div className="h-full px-4 py-4 pb-24 lg:px-6 lg:pb-6">{children}</div>
          )}
        </main>
        {!fullscreenGame && <CopilotPanel className="hidden xl:flex" />}
      </div>

      <MobileAppNav locale={locale} />
    </div>
  );
}

export function AppShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  // WorkspaceCommandsProvider must be OUTSIDE CopilotProvider so that
  // CopilotProvider can call `useWorkspaceCommands().dispatch(...)` to
  // drive the active visual scene from chat responses (PR3).
  return (
    <WorkspaceCommandsProvider>
      <CopilotProvider>
        <ShellGrid locale={locale}>{children}</ShellGrid>
      </CopilotProvider>
    </WorkspaceCommandsProvider>
  );
}
