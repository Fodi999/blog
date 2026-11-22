import { handleMcp } from '@/lib/mcp';

/* POST /mcp — Monge MCP, the public read-only MCP server of the Monge library (Streamable HTTP). See lib/mcp.ts. */
export const dynamic = 'force-dynamic';

export const POST = handleMcp;
export const GET = handleMcp;
export const DELETE = handleMcp;
export const OPTIONS = handleMcp;
