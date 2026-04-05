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
            // Get user data
            const { data: userData, error: userError } = await supabaseAdmin
                .from('users')
                .select('id, username, email, phone_number, avatar')
                .eq('id', authUser.userId)
                .single();

            if (userError || !userData) return res.status(404).json({ error: 'User not found' });

            const { data: meta_data, error: metaError } = await supabaseAdmin
                .from('users_meta')
                .select('bio, dateOfBirth, fatherName, address, cnic, gender')
                .eq('userId', authUser.userId)
                .single();

            const meta: any = metaError ? {} : (meta_data || {});

            const { data: userHobbies, error: hobbiesError } = await supabaseAdmin
                .from('user_hoby')
                .select('hobbyId, hoby(name)')
                .eq('userId', authUser.userId);

            const hobbies = hobbiesError ? [] : (userHobbies?.map((uh: any) => ({
                id: uh.hobbyId,
                name: uh.hoby?.name || 'Unknown'
            })) || []);

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
                hobbies: hobbies,
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

        // Handle userMeta update in UserMeta table
        let metaUpdateResult = null;
        const metaFields = { bio, dateOfBirth, fatherName, address, cnic, gender };
        const hasMetaUpdates = Object.values(metaFields).some(field => field !== undefined);
        
        if (hasMetaUpdates) {
            // Check if user meta record exists
            const { data: existingMeta, error: existingMetaError } = await supabaseAdmin
                .from('users_meta')
                .select('id')
                .eq('userId', authUser.userId)
                .single();

            if (existingMetaError && existingMetaError.code !== 'PGRST116') {
                console.error('Error checking existing user meta:', existingMetaError);
                return res.status(500).json({ error: 'Failed to check user meta data' });
            }

            // Check CNIC uniqueness if it's being updated
            if (cnic !== undefined && cnic !== null && cnic !== '') {
                const { data: existingCnic, error: cnicError } = await supabaseAdmin
                    .from('users_meta')
                    .select('id, userId')
                    .eq('cnic', cnic)
                    .neq('userId', authUser.userId)
                    .single();

                if (cnicError && cnicError.code !== 'PGRST116') {
                    console.error('Error checking existing CNIC:', cnicError);
                    return res.status(500).json({ error: 'Failed to validate CNIC' });
                }

                if (existingCnic) {
                    return res.status(400).json({ error: 'CNIC is already registered to another account' });
                }
            }

            const metaUpdates: any = { updatedAt: new Date().toISOString() };
            if (bio !== undefined) metaUpdates.bio = bio;
            if (dateOfBirth !== undefined) metaUpdates.dateOfBirth = dateOfBirth;
            if (fatherName !== undefined) metaUpdates.fatherName = fatherName;
            if (address !== undefined) metaUpdates.address = address;
            if (cnic !== undefined) metaUpdates.cnic = cnic;
            if (gender !== undefined) metaUpdates.gender = gender;

            if (existingMeta) {
                // Update existing record
                const { data, error } = await supabaseAdmin
                    .from('users_meta')
                    .update(metaUpdates)
                    .eq('userId', authUser.userId)
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
                // Create new record
                const { data, error } = await supabaseAdmin
                    .from('users_meta')
                    .insert({ 
                        userId: authUser.userId, 
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
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

        // Handle hobbies update
        if (hobbies !== undefined) {
            // Delete existing user hobbies
            const { error: deleteError } = await supabaseAdmin
                .from('user_hoby')
                .delete()
                .eq('userId', authUser.userId);

            if (deleteError) {
                console.error('Error deleting existing hobbies:', deleteError);
                return res.status(500).json({ error: 'Failed to update hobbies' });
            }

            // Add new hobbies if any provided
            if (Array.isArray(hobbies) && hobbies.length > 0) {
                const userHobbiesPayload = hobbies.map((hobbyId: string) => ({
                    userId: authUser.userId,
                    hobbyId,
                    createdAt: new Date().toISOString()
                }));

                const { error: insertError } = await supabaseAdmin
                    .from('user_hoby')
                    .insert(userHobbiesPayload);

                if (insertError) {
                    console.error('Error adding hobbies:', insertError);
                    return res.status(500).json({ error: 'Failed to add hobbies' });
                }
            }
        }

        if (Object.keys(updates).length <= 1 && !metaUpdateResult && hobbies === undefined) {
            console.log('No updates to apply:', updates);
            return res.status(400).json({ error: 'Nothing to update' });
        }

        console.log('Applying updates:', updates);

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
                // If only bio was updated, fetch current user data
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

            // Get updated meta data and hobbies
            const finalMeta: any = metaUpdateResult || {};
            let finalHobbies: any[] = [];
            
            // Fetch updated hobbies with names
            const { data: updatedHobbies, error: updatedHobbiesError } = await supabaseAdmin
                .from('user_hoby')
                .select('hobbyId, hoby(name)')
                .eq('userId', authUser.userId);
            
            finalHobbies = updatedHobbies?.map((uh: any) => ({
                id: uh.hobbyId,
                name: uh.hoby?.name || 'Unknown'
            })) || [];
            
            return res.status(200).json({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                phone: userData.phone_number,
                avatar: userData.avatar,
                bio: finalMeta.bio || '',
                dateOfBirth: finalMeta.dateOfBirth || null,
                fatherName: finalMeta.fatherName || null,
                address: finalMeta.address || null,
                cnic: finalMeta.cnic || null,
                gender: finalMeta.gender || null,
                hobbies: finalHobbies,
            });
        } catch (err) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    return res.status(405).json({ message: 'Method not allowed' });
}
