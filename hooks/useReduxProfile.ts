import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { refreshProfile as refreshProfileThunk, updateProfile as updateProfileThunk } from '@/store/slices/profileSlice';
import type { UserProfile } from '@/store/slices/profileSlice';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useProfile = () => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector(state => state.profile.profile);
    const loading = useAppSelector(state => state.profile.loading);
    const error = useAppSelector(state => state.profile.error);

    const refreshProfile = async () => {
        await dispatch(refreshProfileThunk());
    };

    const updateProfileData = (newProfile: UserProfile) => {
        dispatch(updateProfileThunk(newProfile));
    };

    return {
        profile,
        loading,
        refreshProfile,
        updateProfile: updateProfileData,
        error
    };
};
