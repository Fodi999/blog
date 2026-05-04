'use client';

/**
 * CopilotProvider — single source of truth for the right-rail Copilot.
 *
 * Pages call `useSetCopilotContext({ page, selectedEntity })` so the
 * Copilot knows where the user is. The right-rail UI (`<CopilotPanel />`)
 * subscribes to messages, the pending plan and the send/confirm actions.
 *
 * The provider lives in `<AppShell />` so it stays mounted across route
 * navigation inside `/[locale]/app/*` — chat history is preserved when
 * the user switches pages.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocale } from 'next-intl';

import {
  cancelCopilotAction,
  confirmCopilotAction,
  sendCopilotMessage,
  type ActionPlan,
  type CopilotResponse,
  type CopilotScreen,
  type CopilotSelectedEntity,
} from '@/lib/copilot-api';
import {
  useWorkspaceCommands,
  type WorkspaceCommand,
  type SpawnShape,
} from '@/components/workspace/WorkspaceCommands';

export type CopilotMessage =
  | { id: string; role: 'user'; text: string; createdAt: number }
  | {
      id: string;
      role: 'assistant';
      text: string;
      createdAt: number;
      plan: ActionPlan | null;
      requiresConfirmation: boolean;
      planStatus: 'pending' | 'confirmed' | 'cancelled' | 'failed';
      usedTools: string[];
    };

/**
 * Page-supplied insights — what the right rail shows above the chat
 * when the user lands on a page. Each entry is a static, server-data
 * driven hint ("3 items expiring", "1 zero-cost"). Pages register them
 * through `useSetCopilotInsights`, so the panel feels alive even before
 * the user types anything.
 */
export type CopilotInsight = {
  /** Short label, e.g. "3 items expiring soon". */
  label: string;
  /** Optional severity badge color. */
  tone?: 'info' | 'warn' | 'danger' | 'success';
  /** Clicking sends this Copilot prompt. */
  prompt?: string;
};

export type CopilotQuickPrompt = {
  label: string;
  prompt: string;
  tone?: 'default' | 'primary';
};

export type CopilotPageInsights = {
  /** Headline for the insights block ("Inventory needs attention"). */
  title?: string;
  /** Status line below the title ("18 items · €216 · 1 expiring"). */
  subtitle?: string;
  alerts: CopilotInsight[];
  quickPrompts: CopilotQuickPrompt[];
};

export type CopilotContextValue = {
  // Page context
  page: CopilotScreen;
  selectedEntity: CopilotSelectedEntity | null;
  setPageContext: (ctx: { page: CopilotScreen; selectedEntity?: CopilotSelectedEntity | null }) => void;

  // Page-supplied insights (alerts/suggestions for current screen)
  insights: CopilotPageInsights | null;
  setInsights: (i: CopilotPageInsights | null) => void;

  // UI state
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  expanded: boolean; // fullscreen mode
  setExpanded: (v: boolean) => void;
  /** Sidebar (left rail) collapse — shared via the same provider so the
   *  workspace grid can react in one place. */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;

  // Conversation
  messages: CopilotMessage[];
  pending: boolean;
  sendMessage: (text: string) => Promise<void>;
  confirmPlan: (assistantMessageId: string) => Promise<void>;
  cancelPlan: (assistantMessageId: string) => Promise<void>;
  clear: () => void;

  // Billing snapshot (last response)
  actionsLeft: number | null;
};

const CopilotCtx = createContext<CopilotContextValue | null>(null);

function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Scene command inference (PR3) ────────────────────────────────────────────
// Map a Copilot response to a list of WorkspaceCommands that should be
// applied to the active visual scene. Pure function of (response, entity)
// so it can be unit-tested and later replaced with an explicit
// `scene_command` field returned by the backend.

const RISK_TOOLS = new Set([
  'analyze_inventory_risks',
  'find_expiring_items',
  'find_low_stock_items',
  'list_inventory_items',
]);

const RISK_PATTERNS = [
  /\bexpir(ed|ing|ation)\b/i,
  /\bspoil/i,
  /\blow\s*stock\b/i,
  /\brunning\s*low\b/i,
  /\bcritical\b/i,
  /\bat\s*risk\b/i,
  /\bwaste\b/i,
];

const RISK_PLAN_TYPES = new Set([
  'write_off_inventory',
  'adjust_inventory_quantity',
  'create_purchase_draft',
]);

// ── Shape spawn detection ─────────────────────────────────────────────────────
// Detect when user (or assistant) mentions creating / drawing a shape.
// We match both English and Russian keywords so the feature works
// regardless of the user's locale.

const SHAPE_PATTERNS: Array<{ pattern: RegExp; shape: SpawnShape; label: string; color: string }> = [
  { pattern: /\b(square|квадрат)\b/i,                shape: 'square',    label: 'Square',    color: '#38bdf8' },
  { pattern: /\b(rectangle|прямоугольник)\b/i,        shape: 'rectangle', label: 'Rectangle', color: '#a78bfa' },
  { pattern: /\b(circle|круг|окружность|кружок)\b/i,  shape: 'circle',    label: 'Circle',    color: '#34d399' },
  { pattern: /\b(triangle|треугольник)\b/i,           shape: 'triangle',  label: 'Triangle',  color: '#fb923c' },
  { pattern: /\b(cube|куб)\b/i,                       shape: 'cube',      label: 'Cube',      color: '#f472b6' },
  { pattern: /\b(sphere|шар|сфера)\b/i,               shape: 'sphere',    label: 'Sphere',    color: '#facc15' },
  { pattern: /\b(line|линия|линию|линии)\b/i,         shape: 'line',      label: 'Line',      color: '#94a3b8' },
];

// Trigger phrase patterns — must appear alongside a shape keyword.
// "create", "draw", "add", "make", "show", "нарисуй", "создай", etc.
const SPAWN_TRIGGER = /\b(creat|draw|add|make|show|spawn|render|нарисуй|создай|покажи|добавь|сделай)\w*/i;

/** Return the list of shapes explicitly requested in the user's message or copilot answer. */
function detectShapes(text: string): Array<{ shape: SpawnShape; label: string; color: string }> {
  if (!SPAWN_TRIGGER.test(text)) return [];
  return SHAPE_PATTERNS.filter(({ pattern }) => pattern.test(text));
}

function inferSceneCommands(
  res: CopilotResponse,
  selected: CopilotSelectedEntity | null,
  userMessage: string,
): WorkspaceCommand[] {
  const cmds: WorkspaceCommand[] = [];

  const usedRiskTool = res.used_tools.some((t) => RISK_TOOLS.has(t));
  const planMentionsRisk =
    res.action_plan && RISK_PLAN_TYPES.has(res.action_plan.plan_type);
  const textMentionsRisk = RISK_PATTERNS.some((re) => re.test(res.answer));

  if (usedRiskTool || planMentionsRisk || textMentionsRisk) {
    cmds.push({ type: 'highlight_risks' });
  }

  // Focus re-pan when entity selected and answer references it by name.
  if (selected?.type === 'inventory_item' && selected.id) {
    const name = selected.name?.toLowerCase();
    if (name && res.answer.toLowerCase().includes(name)) {
      cmds.push({ type: 'focus_item', itemId: selected.id });
    }
  }

  // ── Shape spawn detection ────────────────────────────────────────────────
  // Check both the user's original message and the assistant answer so the
  // command fires even when the LLM paraphrases the intent.
  const shapesFromUser = detectShapes(userMessage);
  const shapesFromAnswer = detectShapes(res.answer);
  // Merge — deduplicate by shape key.
  const seen = new Set<string>();
  const allShapes = [...shapesFromUser, ...shapesFromAnswer].filter(({ shape }) => {
    if (seen.has(shape)) return false;
    seen.add(shape);
    return true;
  });

  if (allShapes.length > 0) {
    // Switch the scene to LAB before spawning so the shape is visible.
    cmds.push({ type: 'switch_lab' });
    for (const { shape, label, color } of allShapes) {
      cmds.push({ type: 'spawn_shape', shape, label, color });
    }
  }

  return cmds;
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const { dispatch: dispatchWorkspace } = useWorkspaceCommands();

  const [page, setPage] = useState<CopilotScreen>('dashboard');
  const [selectedEntity, setSelectedEntity] = useState<CopilotSelectedEntity | null>(null);
  const [insights, setInsights] = useState<CopilotPageInsights | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [actionsLeft, setActionsLeft] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Persist sidebar collapse preference across reloads.
  useEffect(() => {
    try {
      const v = window.localStorage.getItem('chefos:sidebarCollapsed');
      if (v === '1') setSidebarCollapsedState(true);
    } catch {
      /* ignore */
    }
  }, []);
  const setSidebarCollapsed = useCallback((v: boolean) => {
    setSidebarCollapsedState(v);
    try {
      window.localStorage.setItem('chefos:sidebarCollapsed', v ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const setPageContext = useCallback(
    (ctx: { page: CopilotScreen; selectedEntity?: CopilotSelectedEntity | null }) => {
      setPage(ctx.page);
      setSelectedEntity(ctx.selectedEntity ?? null);
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      const userMsg: CopilotMessage = {
        id: uid(),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setPending(true);

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res: CopilotResponse = await sendCopilotMessage(
          {
            message: trimmed,
            screen: page,
            entity_id: selectedEntity?.id ?? null,
            locale,
          },
          ctrl.signal,
        );

        setActionsLeft(res.actions_left);
        const assistantMsg: CopilotMessage = {
          id: uid(),
          role: 'assistant',
          text: res.answer,
          createdAt: Date.now(),
          plan: res.action_plan,
          requiresConfirmation: res.requires_confirmation,
          planStatus: res.action_plan ? 'pending' : 'confirmed',
          usedTools: res.used_tools,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // PR3 — drive the active visual scene from the Copilot response.
        // Pure inference for now (no backend changes); explicit
        // `scene_command` field can be added later.
        for (const cmd of inferSceneCommands(res, selectedEntity, trimmed)) {
          dispatchWorkspace(cmd);
        }
      } catch (err) {
        if (ctrl.signal.aborted) return;
        const errorMsg: CopilotMessage = {
          id: uid(),
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Copilot request failed',
          createdAt: Date.now(),
          plan: null,
          requiresConfirmation: false,
          planStatus: 'failed',
          usedTools: [],
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
        setPending(false);
      }
    },
    [pending, page, selectedEntity, locale, dispatchWorkspace],
  );

  const confirmPlan = useCallback(async (assistantMessageId: string) => {
    const target = messagesRef.current.find((m) => m.id === assistantMessageId);
    if (!target || target.role !== 'assistant' || !target.plan) return;
    const planId = target.plan.id;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantMessageId && m.role === 'assistant'
          ? { ...m, planStatus: 'pending' }
          : m,
      ),
    );

    try {
      await confirmCopilotAction(planId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId && m.role === 'assistant'
            ? { ...m, planStatus: 'confirmed' }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId && m.role === 'assistant'
            ? {
                ...m,
                planStatus: 'failed',
                text: `${m.text}\n\n⚠ ${err instanceof Error ? err.message : 'confirm failed'}`,
              }
            : m,
        ),
      );
    }
  }, []);

  const cancelPlan = useCallback(async (assistantMessageId: string) => {
    const target = messagesRef.current.find((m) => m.id === assistantMessageId);
    if (!target || target.role !== 'assistant' || !target.plan) return;
    const planId = target.plan.id;

    try {
      await cancelCopilotAction(planId);
    } catch {
      /* still mark cancelled locally */
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantMessageId && m.role === 'assistant'
          ? { ...m, planStatus: 'cancelled' }
          : m,
      ),
    );
  }, []);

  // Keep a ref of messages for stable callbacks above.
  const messagesRef = useRef<CopilotMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const clear = useCallback(() => {
    setMessages([]);
    abortRef.current?.abort();
  }, []);

  const value = useMemo<CopilotContextValue>(
    () => ({
      page,
      selectedEntity,
      setPageContext,
      insights,
      setInsights,
      collapsed,
      setCollapsed,
      expanded,
      setExpanded,
      sidebarCollapsed,
      setSidebarCollapsed,
      messages,
      pending,
      sendMessage,
      confirmPlan,
      cancelPlan,
      clear,
      actionsLeft,
    }),
    [
      page,
      selectedEntity,
      setPageContext,
      insights,
      collapsed,
      expanded,
      sidebarCollapsed,
      setSidebarCollapsed,
      messages,
      pending,
      sendMessage,
      confirmPlan,
      cancelPlan,
      clear,
      actionsLeft,
    ],
  );

  return <CopilotCtx.Provider value={value}>{children}</CopilotCtx.Provider>;
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotCtx);
  if (!ctx) throw new Error('useCopilot must be used inside <CopilotProvider>');
  return ctx;
}

/**
 * Page helper — call this from any page inside /[locale]/app/* to tell
 * the Copilot what the user is currently looking at. The placeholder,
 * quick actions and backend `screen` arg all derive from this.
 *
 * Example:
 *   useSetCopilotContext({
 *     page: 'inventory',
 *     selectedEntity: selected ? { type: 'inventory_item', id: selected.id, name: selected.name } : null,
 *   });
 */
export function useSetCopilotContext(ctx: {
  page: CopilotScreen;
  selectedEntity?: CopilotSelectedEntity | null;
}) {
  const { setPageContext } = useCopilot();
  const key = `${ctx.page}|${ctx.selectedEntity?.type ?? ''}|${ctx.selectedEntity?.id ?? ''}`;
  useEffect(() => {
    setPageContext(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * Page helper — register the live insights block (alerts + quick prompts)
 * that should show in the Copilot panel for this screen. Pass `null`
 * (or omit the call) to clear the panel back to the empty state.
 *
 * Insights auto-clear when the component unmounts.
 *
 * Example (Inventory):
 *   useSetCopilotInsights({
 *     title: 'Inventory needs attention',
 *     subtitle: `${stats.itemsCount} items · €${stats.totalValuePLN.toFixed(0)}`,
 *     alerts: [
 *       { label: `${stats.expiringCount} expiring soon`, tone: 'warn',
 *         prompt: 'Show items that expire in 3 days' },
 *       { label: `${stats.lowCount} low stock`, tone: 'danger',
 *         prompt: 'Which items are running low?' },
 *     ],
 *     quickPrompts: [
 *       { label: 'Daily briefing', prompt: 'Daily briefing' },
 *       { label: 'Write off expired', prompt: 'Write off all expired items' },
 *     ],
 *   });
 */
export function useSetCopilotInsights(insights: CopilotPageInsights | null) {
  const { setInsights } = useCopilot();
  // Stable key to avoid infinite re-renders when consumers pass new objects.
  const key = JSON.stringify(insights ?? null);
  useEffect(() => {
    setInsights(insights);
    return () => setInsights(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
