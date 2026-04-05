interface UserProfile {
    id: string;
    username: string;
    email: string;
    phone: string;
    avatar: string;
    bio: string;
    dateOfBirth?: string;
    fatherName?: string;
    address?: string;
    cnic?: string;
    gender?: string;
    hobbies?: { id: string, name: string }[];
}

/**
 * Global utility functions for managing user data in localStorage
 */

export const userStorage = {
    /**
     * Get user data from localStorage
     * @returns UserProfile | null
     */
    get(): UserProfile | null {
        try {
            const userData = localStorage.getItem('user_data');
            if (!userData) return null;
            
            const parsed = JSON.parse(userData);
            return {
                id: parsed.id || '',
                username: parsed.username || '',
                email: parsed.email || '',
                phone: parsed.phone || '',
                avatar: parsed.avatar || '',
                bio: parsed.bio || '',
                dateOfBirth: parsed.dateOfBirth || '',
                fatherName: parsed.fatherName || '',
                address: parsed.address || '',
                cnic: parsed.cnic || '',
                gender: parsed.gender || '',
                hobbies: parsed.hobbies || []
            };
        } catch (error) {
            console.error('Error getting user data from localStorage:', error);
            return null;
        }
    },

    /**
     * Set user data in localStorage
     * @param userData - User profile data to save
     */
    set(userData: Partial<UserProfile>): void {
        try {
            const currentData = userStorage.get() || {} as UserProfile;
            const updatedData = {
                ...currentData,
                ...userData,
                // Ensure all required fields have default values
                id: userData.id || currentData.id || '',
                username: userData.username || currentData.username || '',
                email: userData.email || currentData.email || '',
                phone: userData.phone || currentData.phone || '',
                avatar: userData.avatar || currentData.avatar || '',
                bio: userData.bio || currentData.bio || '',
                dateOfBirth: userData.dateOfBirth || currentData.dateOfBirth || '',
                fatherName: userData.fatherName || currentData.fatherName || '',
                address: userData.address || currentData.address || '',
                cnic: userData.cnic || currentData.cnic || '',
                gender: userData.gender || currentData.gender || '',
                hobbies: userData.hobbies || currentData.hobbies || []
            };
            
            localStorage.setItem('user_data', JSON.stringify(updatedData));
            console.log('✅ User data saved to localStorage');
        } catch (error) {
            console.error('Error setting user data in localStorage:', error);
        }
    },

    /**
     * Update specific fields in user data
     * @param updates - Fields to update
     */
    update(updates: Partial<UserProfile>): void {
        const currentData = userStorage.get();
        if (currentData) {
            userStorage.set({ ...currentData, ...updates });
        }
    },

    /**
     * Clear user data from localStorage
     */
    clear(): void {
        try {
            localStorage.removeItem('user_data');
            console.log('✅ User data cleared from localStorage');
        } catch (error) {
            console.error('Error clearing user data from localStorage:', error);
        }
    },

    /**
     * Check if user data exists in localStorage
     * @returns boolean
     */
    exists(): boolean {
        return userStorage.get() !== null;
    },

    /**
     * Get specific field from user data
     * @param field - Field name to get
     * @returns field value or null
     */
    getField<K extends keyof UserProfile>(field: K): UserProfile[K] | null {
        const userData = userStorage.get();
        return userData ? userData[field] : null;
    },

    /**
     * Set specific field in user data
     * @param field - Field name to set
     * @param value - Field value
     */
    setField<K extends keyof UserProfile>(field: K, value: UserProfile[K]): void {
        userStorage.update({ [field]: value });
    }
};

export default userStorage;
