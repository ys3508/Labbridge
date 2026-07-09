import { checkPlan } from "@/lib/moduleCheck";

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const plan = payload?.plan || payload;
  return Response.json(checkPlan(plan));
}
