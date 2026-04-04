import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { getAuthUser } from '../../../utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Please login' });
    }

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .select('id, username, email, phone_number, avatar')
                .eq('id', authUser.userId)
                .single();

            if (error || !data) return res.status(404).json({ error: 'User not found' });

            return res.status(200).json({
                id: data.id,
                username: data.username,
                email: data.email,
                phone: data.phone_number,
                avatar: data.avatar,
            });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    if (req.method === 'PATCH') {
        const { username, phone, avatar } = req.body;
        console.log('Profile update request:', { username, phone, avatar: avatar ? 'provided' : 'not provided' });
        
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        
        // Get current user data first
        const { data: currentUser, error: currentUserError } = await supabaseAdmin
            .from('users')
            .select('username, phone_number')
            .eq('id', authUser.userId)
            .single();
        
        if (currentUserError || !currentUser) {
            console.error('Error fetching current user:', currentUserError);
            return res.status(500).json({ error: 'Failed to fetch current user data' });
        }
        
        // Check if username is being updated
        const isUsernameUpdating = typeof username === 'string' && username.length >= 2;
        
        if (isUsernameUpdating) {
            // Only check for duplicate if username is actually changing
            if (username !== currentUser.username) {
                const { data: existingUser, error: existingUserError } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .single();
                
                if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.error('Error checking existing username:', existingUserError);
                    return res.status(500).json({ error: 'Failed to validate username' });
                }
                
                if (existingUser) {
                    return res.status(400).json({ error: 'Username already taken' });
                }
            }
            
            updates.username = username;
        }
        
        const isPhoneUpdating = typeof phone === 'string' && phone.length > 0;
        
        if (isPhoneUpdating) {
            // Only check for duplicate if phone is actually changing
            console.log('Phone validation - current:', currentUser.phone_number, 'new:', phone);
            if (phone !== currentUser.phone_number) {
                const { data: existingPhone, error: existingPhoneError } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('phone_number', phone)
                    .single();
                
                console.log('Phone check result:', { existingPhone, existingPhoneError });
                
                if (existingPhoneError && existingPhoneError.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.error('Error checking existing phone:', existingPhoneError);
                    return res.status(500).json({ error: 'Failed to validate phone number' });
                }
                
                if (existingPhone) {
                    console.log('Phone number already exists for user ID:', existingPhone.id);
                    return res.status(400).json({ error: 'This phone number is already registered to another account. Please use a different phone number.' });
                }
            }
            
            updates.phone_number = phone;
        }
        
        if (typeof avatar === 'string') updates.avatar = avatar;

        if (Object.keys(updates).length <= 1) {
            console.log('No updates to apply:', updates);
            return res.status(400).json({ error: 'Nothing to update' });
        }

        console.log('Applying updates:', updates);

        try {
            const { data, error } = await supabaseAdmin
                .from('users')
                .update(updates)
                .eq('id', authUser.userId)
                .select('id, username, email, phone_number, avatar')
                .single();

            if (error) {
                return res.status(400).json({ error: error.message || 'Update failed' });
            }
            
            if (!data) {
                return res.status(404).json({ error: 'User not found after update' });
            }
            return res.status(200).json({
                id: data.id,
                username: data.username,
                email: data.email,
                phone: data.phone_number,
                avatar: data.avatar,
            });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
