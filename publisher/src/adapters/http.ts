export async function parseJsonOrThrow<T>(resp: Response, platform: string): Promise<T> {
  const text = await resp.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!resp.ok) {
    throw new Error(`${platform} publish failed: ${resp.status} ${text}`);
  }

  return data as T;
}

export function requireExternalId(id: string | undefined, platform: string): string {
  if (!id) throw new Error(`${platform} publish response did not include an external id`);
  return id;
}
