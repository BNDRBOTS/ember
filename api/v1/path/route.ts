import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY = process.env.API_GATEWAY_URL || "http://localhost:8080";

async function proxy(req: NextRequest) {
  const url = req.nextUrl.pathname.replace("/api/v1", "/api/v1") + req.nextUrl.search;
  const backendUrl = `${API_GATEWAY}${url}`;
  const headers = new Headers(req.headers);
  headers.set("host", new URL(API_GATEWAY).host);
  const resp = await fetch(backendUrl, {
    method: req.method,
    headers,
    body: req.body ? await req.text() : undefined,
  });
  const data = await resp.text();
  return new NextResponse(data, { status: resp.status, headers: resp.headers });
}

export async function GET(req: NextRequest) { return proxy(req); }
export async function POST(req: NextRequest) { return proxy(req); }
export async function PUT(req: NextRequest) { return proxy(req); }
export async function DELETE(req: NextRequest) { return proxy(req); }
export async function PATCH(req: NextRequest) { return proxy(req); }
