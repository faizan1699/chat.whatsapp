import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { jwtVerify, JWTPayload } from 'jose';
import { parse } from 'cookie';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');

interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'access';
}

async function getAuthUser(req: NextApiRequest): Promise<SessionPayload | null> {
    let accessToken: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
    }
    else {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
            return null;
        }

        const cookies = parse(cookieHeader);
        accessToken = cookies['access_token'];
    }

    if (!accessToken) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(accessToken, secret) as { payload: SessionPayload };

        if (payload.type !== 'access') {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authUser = await getAuthUser(req);
    if (!authUser) {
        return res.status(401).json({ error: 'Please login' });
    }

    if (req.method === 'GET') {
        try {
            // Get user data
            const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select('id, username, email, phone_number, avatar')
                .eq('id', authUser.userId)
                .single();

            if (userError || !userData) return res.status(404).json({ error: 'User not found' });

            const { data: meta_data, error: metaError } = await supabaseAdmin
                .from('users_meta')
                .select('*')
                .eq('user_id', authUser.userId)
                .single();

            const meta: any = metaError ? {} : (meta_data || {});

            // Get hobbies from meta.hobbies if it exists
            let hobbyIds: string[] = [];
            if (meta.hobbies) {
                try {
                    if (typeof meta.hobbies === 'string') {
                        hobbyIds = JSON.parse(meta.hobbies);
                    } else if (Array.isArray(meta.hobbies)) {
                        hobbyIds = meta.hobbies;
                    }
                } catch (err) {
                    hobbyIds = [];
                }
            }

            let hobbiesWithNames: any[] = [];
            if (hobbyIds.length > 0) {
                try {
                    const { data: hobbiesData } = await supabaseAdmin
                        .from('hobby')
                        .select('id, name')
                        .in('id', hobbyIds);

                    hobbiesWithNames = hobbiesData || [];
                } catch (err) {
                    console.error('Error fetching hobby details:', err);
                }
            }



            return res.status(200).json({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                phone: userData.phone_number,
                avatar: userData.avatar,
                bio: meta.bio || '',
                dateOfBirth: meta.dateOfBirth || null,
                fatherName: meta.fatherName || null,
                address: meta.address || null,
                cnic: meta.cnic || null,
                gender: meta.gender || null,
                hobbies: hobbiesWithNames,
            });
        } catch (err) {
            console.error('Profile GET error:', err);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    if (req.method === 'PATCH') {
        const { username, phone, avatar, bio, dateOfBirth, fatherName, address, cnic, gender, hobbies } = req.body;
        console.log('Profile update request:', { username, phone, avatar: avatar ? 'provided' : 'not provided', bio: bio ? 'provided' : 'not provided' });

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        const { data: currentUser, error: currentUserError } = await supabaseAdmin
            .from('users')
            .select('username, phone_number')
            .eq('id', authUser.userId)
            .single();

        if (currentUserError || !currentUser) {
            console.error('Error fetching current user:', currentUserError);
            return res.status(500).json({ error: 'Failed to fetch current user data' });
        }
        const isUsernameUpdating = typeof username === 'string' && username.length >= 2;

        if (isUsernameUpdating) {
            if (username !== currentUser.username) {
                const { data: existingUser, error: existingUserError } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (existingUserError && existingUserError.code !== 'PGRST116') {
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
            if (phone !== currentUser.phone_number) {
                const { data: existingPhone, error: existingPhoneError } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('phone_number', phone)
                    .single();

                if (existingPhoneError && existingPhoneError.code !== 'PGRST116') {
                    console.error('Error checking existing phone:', existingPhoneError);
                    return res.status(500).json({ error: 'Failed to validate phone number' });
                }

                if (existingPhone) {
                    return res.status(400).json({ error: 'This phone number is already registered to another account. Please use a different phone number.' });
                }
            }

            updates.phone_number = phone;
        }

        if (typeof avatar === 'string') updates.avatar = avatar;

        let metaUpdateResult = null;
        const metaFields = { bio, dateOfBirth, fatherName, address, cnic, gender };
        const hasMetaUpdates = Object.values(metaFields).some(field => field !== undefined);

        if (hasMetaUpdates) {
            const { data: existingMeta, error: existingMetaError } = await supabaseAdmin
                .from('users_meta')
                .select('id')
                .eq('user_id', authUser.userId)
                .single();

            if (existingMetaError && existingMetaError.code !== 'PGRST116') {
                console.error('Error checking existing user meta:', existingMetaError);
                return res.status(500).json({ error: 'Failed to check user meta data' });
            }

            if (cnic !== undefined && cnic !== null && cnic !== '') {
                const { data: existingCnic, error: cnicError } = await supabaseAdmin
                    .from('users_meta')
                    .select('id, user_id')
                    .eq('cnic', cnic)
                    .neq('user_id', authUser.userId)
                    .single();

                if (cnicError && cnicError.code !== 'PGRST116') {
                    console.error('Error checking existing CNIC:', cnicError);
                    return res.status(500).json({ error: 'Failed to validate CNIC' });
                }

                if (existingCnic) {
                    return res.status(400).json({ error: 'CNIC is already registered to another account' });
                }
            }

            const metaUpdates: any = { updated_at: new Date().toISOString() };
            if (bio !== undefined) metaUpdates.bio = bio;
            if (dateOfBirth !== undefined) metaUpdates.dateOfBirth = dateOfBirth;
            if (fatherName !== undefined) metaUpdates.fatherName = fatherName;
            if (address !== undefined) metaUpdates.address = address;
            if (cnic !== undefined) metaUpdates.cnic = cnic;
            if (gender !== undefined) metaUpdates.gender = gender;

            if (existingMeta) {
                const { data, error } = await supabaseAdmin
                    .from('users_meta')
                    .update(metaUpdates)
                    .eq('user_id', authUser.userId)
                    .select('bio, dateOfBirth, fatherName, address, cnic, gender')
                    .single();

                if (error) {
                    console.error('Error updating user meta:', error);
                    if (error.code === '23505' && error.message.includes('cnic')) {
                        return res.status(400).json({ error: 'CNIC is already registered to another account' });
                    }
                    return res.status(400).json({ error: 'Failed to update profile information' });
                }
                metaUpdateResult = data;
            } else {
                const { data, error } = await supabaseAdmin
                    .from('users_meta')
                    .insert({
                        user_id: authUser.userId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        ...metaUpdates
                    })
                    .select('bio, dateOfBirth, fatherName, address, cnic, gender')
                    .single();

                if (error) {
                    console.error('Error creating user meta:', error);
                    if (error.code === '23505' && error.message.includes('cnic')) {
                        return res.status(400).json({ error: 'CNIC is already registered to another account' });
                    }
                    return res.status(400).json({ error: 'Failed to save profile information' });
                }
                metaUpdateResult = data;
            }
        }

        if (hobbies !== undefined) {
            const metaUpdates: any = { hobbies };

            const { error: metaUpdateError } = await supabaseAdmin
                .from('users_meta')
                .update(metaUpdates)
                .eq('user_id', authUser.userId)
                .select('bio, dateOfBirth, fatherName, address, cnic, gender, hobbies')
                .single();

            if (metaUpdateError) {
                console.error('Error updating user meta with hobbies:', metaUpdateError);
                return res.status(500).json({ error: 'Failed to update hobbies' });
            }
        }

        if (Object.keys(updates).length <= 1 && !metaUpdateResult && hobbies === undefined) {
            console.log('No updates to apply:', updates);
            return res.status(400).json({ error: 'Nothing to update' });
        }

        try {
            let userData = null;
            if (Object.keys(updates).length > 1) {
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
                userData = data;
            } else {
                const { data, error } = await supabaseAdmin
                    .from('users')
                    .select('id, username, email, phone_number, avatar')
                    .eq('id', authUser.userId)
                    .single();
                if (error || !data) {
                    return res.status(404).json({ error: 'User not found' });
                }
                userData = data;
            }

            const { data: currentMeta } = await supabaseAdmin
                .from('users_meta')
                .select('*')
                .eq('user_id', authUser.userId)
                .single();

            const meta = currentMeta || {};

            let finalHobbies: any[] = [];
            if (meta.hobbies) {
                try {
                    let hobbyIds: string[] = [];
                    if (typeof meta.hobbies === 'string') {
                        hobbyIds = JSON.parse(meta.hobbies);
                    } else if (Array.isArray(meta.hobbies)) {
                        hobbyIds = meta.hobbies.map((h: any) => typeof h === 'string' ? h : h.id);
                    }
                    
                    if (hobbyIds.length > 0) {
                        const { data: hobbiesData } = await supabaseAdmin
                            .from('hobby')
                            .select('id, name')
                            .in('id', hobbyIds);
                        
                        finalHobbies = hobbiesData || [];
                    }
                } catch (err) {
                    console.error('Error processing hobbies in PATCH:', err);
                    finalHobbies = [];
                }
            }

            console.log("finalHobbiesfinalHobbiesfinalHobbiesfinalHobbies", finalHobbies)

            return res.status(200).json({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                phone: userData.phone_number,
                avatar: userData.avatar,
                bio: meta.bio || '',
                dateOfBirth: meta.dateOfBirth || null,
                fatherName: meta.fatherName || null,
                address: meta.address || null,
                cnic: meta.cnic || null,
                gender: meta.gender || null,
                hobbies: finalHobbies,
            });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
