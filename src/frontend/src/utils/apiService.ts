function getCrmConfig(): { apiUrl: string; sheetId: string } {
  try {
    return JSON.parse(localStorage.getItem("CRM_CONFIG") || "{}");
  } catch {
    return { apiUrl: "", sheetId: "" };
  }
}

export function getApiUrl(): string {
  return getCrmConfig().apiUrl || "";
}

// GET with cache-busting timestamp
export async function apiFetch(
  params: Record<string, string>,
): Promise<unknown> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;
  const url = new URL(apiUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("_", Date.now().toString());
  console.log("[Hirevena API] GET", url.toString());
  const res = await fetch(url.toString());
  const data = await res.json();
  console.log("[Hirevena API] Response:", data);
  return data;
}

// POST data to API
export async function apiPost(data: Record<string, unknown>): Promise<unknown> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;
  console.log("[Hirevena API] POST", data);
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  console.log("[Hirevena API] POST result:", result);
  return result;
}
