import { createClient } from "@/lib/supabase/server";

export type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerDepartment: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  unreadCount: number;
};

/**
 * 自分が関わる全メッセージから、相手ごとの最新メッセージと未読数を集約して返す。
 */
export async function getConversations(myId: string): Promise<Conversation[]> {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, from_id, to_id, content, created_at, read_at")
    .or(`from_id.eq.${myId},to_id.eq.${myId}`)
    .order("created_at", { ascending: false });

  if (error || !messages) return [];

  const map = new Map<
    string,
    {
      partnerId: string;
      lastMessage: string;
      lastMessageAt: string;
      lastMessageFromMe: boolean;
      unreadCount: number;
    }
  >();

  for (const m of messages) {
    const partnerId = m.from_id === myId ? m.to_id : m.from_id;
    const fromMe = m.from_id === myId;

    if (!map.has(partnerId)) {
      map.set(partnerId, {
        partnerId,
        lastMessage: m.content,
        lastMessageAt: m.created_at,
        lastMessageFromMe: fromMe,
        unreadCount: 0,
      });
    }

    if (!fromMe && !m.read_at) {
      const entry = map.get(partnerId)!;
      entry.unreadCount += 1;
    }
  }

  if (map.size === 0) return [];

  const partnerIds = [...map.keys()];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, real_name, department")
    .in("id", partnerIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );

  return [...map.values()]
    .sort((a, b) => (a.lastMessageAt > b.lastMessageAt ? -1 : 1))
    .map((c) => {
      const p = profileMap.get(c.partnerId);
      return {
        ...c,
        partnerName: (p?.real_name as string) ?? "（名前未設定）",
        partnerDepartment: (p?.department as string | null) ?? null,
      };
    });
}
