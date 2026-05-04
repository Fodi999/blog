/**
 * POST /api/geometry-vision-review
 *
 * Sends a screenshot of the current 3D model to Gemini Vision.
 * Gemini analyses whether the geometry matches the original intent
 * and optionally returns corrections to the GeometryOpRequest.
 *
 * Input:
 *   { screenshot: "data:image/png;base64,...", op: GeometryOpRequest }
 *
 * Output:
 *   { approved: boolean, feedback?: string, correction?: Partial<GeometryOpRequest> }
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_VISION_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ approved: true, feedback: 'Vision key not configured' });
  }

  const { screenshot, op } = await req.json();
  if (!screenshot || !op) {
    return NextResponse.json({ approved: true });
  }

  // Strip data URI prefix
  const base64 = (screenshot as string).replace(/^data:image\/\w+;base64,/, '');

  const prompt = `You are a 3D geometry quality inspector.

The user requested this CSG operation:
${JSON.stringify(op, null, 2)}

I will show you a screenshot of the resulting 3D model.

Analyse the model and respond with ONLY valid JSON in this exact format:
{
  "approved": true|false,
  "feedback": "one sentence describing what you see",
  "correction": null | { partial GeometryOpRequest fields to change }
}

Rules:
- approved=true if the shape looks correct (hole is visible, proportions reasonable)
- approved=false if the hole is missing, wrong size, or badly placed
- correction: only include fields that need changing (e.g. cutter.radius)
- Be lenient — minor imperfections are fine. Only reject obvious failures.`;

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64,
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  };

  try {
    const res = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[geometry-vision-review] Gemini error:', res.status);
      return NextResponse.json({ approved: true });
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

    // Extract JSON from Gemini response (may be wrapped in markdown)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ approved: true, feedback: text });

    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error('[geometry-vision-review]', e);
    return NextResponse.json({ approved: true });
  }
}
