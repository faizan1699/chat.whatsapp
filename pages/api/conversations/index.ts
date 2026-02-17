import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { userId } = req.query;
        if (!userId || typeof userId !== 'string') return res.status(400).end();

        try {
            const { data: participantRows, error: pe } = await supabaseAdmin
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (pe || !participantRows?.length) {
                return res.status(200).json([]);
            }

            const convIds = participantRows.map((p) => p.conversation_id);
            const { data: conversations, error: ce } = await supabaseAdmin
                .from('conversations')
                .select('*')
                .in('id', convIds)
                .order('created_at', { ascending: false });

            if (ce) throw ce;

            const result = await Promise.all(
                (conversations || []).map(async (conv) => {
                    const { data: partRows } = await supabaseAdmin
                        .from('conversation_participants')
                        .select('user_id')
                        .eq('conversation_id', conv.id);
                    const userIds = (partRows || []).map((p) => p.user_id);
                    const { data: usersData } = userIds.length
                        ? await supabaseAdmin.from('users').select('id, username, avatar').in('id', userIds)
                        : { data: [] };
                    const participants = (usersData || []).map((u) => ({ user: u }));

                    const { data: lastMsg } = await supabaseAdmin
                        .from('messages')
                        .select('*')
                        .eq('conversation_id', conv.id)
                        .order('timestamp', { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        id: conv.id,
                        name: conv.name,
                        isGroup: conv.is_group,
                        createdAt: conv.created_at,
                        updatedAt: conv.updated_at,
                        participants: (participants || []).map((p: { user: unknown }) => ({ user: p.user })),
                        messages: lastMsg ? [lastMsg] : [],
                    };
                })
            );

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch conversations' });
        }
    } else if (req.method === 'POST') {
        const { participantIds } = req.body;
        if (!participantIds || !Array.isArray(participantIds)) return res.status(400).end();

        try {
            if (participantIds.length === 2) {
                const { data: existingConvs } = await supabaseAdmin
                    .from('conversation_participants')
                    .select('conversation_id')
                    .in('user_id', participantIds);

                if (existingConvs?.length) {
                    const convCounts: Record<string, number> = {};
                    existingConvs.forEach((r) => {
                        convCounts[r.conversation_id] = (convCounts[r.conversation_id] || 0) + 1;
                    });
                    const sharedConv = Object.entries(convCounts).find(([, c]) => c === 2);
                    if (sharedConv) {
                        const { data: conv } = await supabaseAdmin
                            .from('conversations')
                            .select('*')
                            .eq('id', sharedConv[0])
                            .single();
                        if (conv) return res.status(200).json(conv);
                    }
                }
            }

            const { data: newConv, error: ec } = await supabaseAdmin
                .from('conversations')
                .insert({
                    is_group: participantIds.length > 2,
                })
                .select('*')
                .single();

            if (ec) throw ec;

            await supabaseAdmin.from('conversation_participants').insert(
                participantIds.map((uid: string) => ({
                    user_id: uid,
                    conversation_id: newConv.id,
                }))
            );

            res.status(201).json(newConv);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create conversation' });
        }
    } else {
        res.status(405).end();
    }
}
