'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { User, Phone, Calendar, Shield, Tag, Camera } from 'lucide-react';
import { PatternFormat } from 'react-number-format';
import HobbiesSelector from '@/components/global/HobbiesSelector';
import { UserProfileDTO } from '@/utils/helpers/models/auth.dto';
import { apiService } from '@/services/apiService';
import { useProfile } from '@/hooks/useReduxProfile';
import { useImageCropper } from '@/hooks/useImageCropper';
import GlobalImageCropper from '@/components/global/GlobalImageCropper';
import { infoToaster } from '@/utils/helpers/common/toast.utils';

interface ProfileEditFormProps {
    setIsEditing: (value: boolean) => void;
}

export default function ProfileEditForm({
    setIsEditing
}: ProfileEditFormProps) {

    const {
        selectedImage,
        croppedImage,
        showCropper,
        crop,
        zoom,
        setCrop,
        setZoom,
        handleImageSelect,
        handleCropComplete,
        handleCropConfirm,
        handleCropCancel,
        resetCropper,
        setShowCropper
    } = useImageCropper();


    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<UserProfileDTO>();

    const {
        profile: profileData,
        refreshProfile
    } = useProfile();

    const [editLoading, setEditLoading] = useState<boolean>(false);
    const [formData, setFormData] = useState<UserProfileDTO>(new UserProfileDTO());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setValue(name as any, value);
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleCropImage = async () => {
        if (!formData.avatar) return;
        
        try {
            const response = await fetch(formData.avatar);
            const blob = await response.blob();
            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
            setShowCropper(true);
            handleImageSelect(file);
        } catch (error) {
            alert('Failed to process image for cropping');
        }
    };

    useEffect(() => {
        if (profileData) {
            const mappedHobbies = (profileData.hobbies || []).map((h: any) =>
                typeof h === 'string' ? { id: h, name: '' } : h
            );
            const profileFormData = {
                id: profileData.id || '',
                username: profileData.username || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                avatar: profileData.avatar || '',
                bio: profileData.bio || '',
                dateOfBirth: profileData.dateOfBirth ?
                    new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
                fatherName: profileData.fatherName || '',
                address: profileData.address || '',
                cnic: profileData.cnic || '',
                gender: profileData.gender || '',
                hobbies: mappedHobbies
            };
            setFormData(profileFormData);
            Object.entries(profileFormData).forEach(([key, value]) => {
                setValue(key as any, value);
            });
        }
    }, [profileData, setValue]);

    useEffect(() => {
        if (formData) {
            const fields = [
                'username', 'email', 'phone', 'avatar', 'bio',
                'dateOfBirth', 'fatherName', 'address', 'cnic', 'gender', 'hobbies'
            ];

            fields.forEach(field => {
                const value = formData[field as keyof UserProfileDTO] || '';
                setValue(field as any, value);
            });
        }
    }, [formData, setValue]);

    const onSubmit = async () => {
        setEditLoading(true);
        try {
            const formValues = watch();
            const changedFields: Record<string, any> = {};

            const fields: (keyof UserProfileDTO)[] = [
                'username', 'phone', 'avatar', 'bio', 'dateOfBirth',
                'fatherName', 'address', 'cnic', 'gender'
            ];

            fields.forEach(field => {
                const currentValue = formValues[field];
                const originalValue = (profileData as any)?.[field];
                
                let shouldUpdate = false;
                if (field === 'dateOfBirth') {
                    const currentDate = typeof currentValue === 'string' && currentValue ? new Date(currentValue).toISOString().split('T')[0] : '';
                    const originalDate = typeof originalValue === 'string' && originalValue ? new Date(originalValue).toISOString().split('T')[0] : '';
                    shouldUpdate = currentDate !== originalDate && currentDate !== '';
                } else {
                    shouldUpdate = currentValue !== originalValue && currentValue !== undefined;
                }
                
                if (shouldUpdate) {
                    changedFields[field] = currentValue || undefined;
                }
            });

            const currentHobbyIds = (profileData?.hobbies || []).map((h: any) => typeof h === 'string' ? h : h.id);
            const formHobbyIds = (formValues.hobbies || []).map((h: any) => typeof h === 'string' ? h : h.id);

            if (JSON.stringify(formHobbyIds) !== JSON.stringify(currentHobbyIds)) {
                changedFields.hobbies = formHobbyIds;
            }

            if (Object.keys(changedFields).length === 0) {
                infoToaster("No changes to save");
                return;
            }

            await apiService.updateProfile(changedFields);
            await refreshProfile();
            setIsEditing(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };



    useEffect(() => {
        if (croppedImage) {
            setValue('avatar', croppedImage);
            setFormData((prev) => ({
                ...prev,
                avatar: croppedImage
            }));
        }
    }, [croppedImage, setValue, setFormData]);

    return (
        <Fragment>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} >
                <div className="flex justify-center">
                    <div className="relative">
                        {formData.avatar ? (
                            <img
                                src={formData.avatar}
                                alt={formData.username}
                                onClick={handleCropImage}
                                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                            />
                        ) : (
                            <div className="rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                                <User className="h-32 w-32 text-gray-400" />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="avatar-upload-edit"
                        />
                        <label
                            htmlFor="avatar-upload-edit"
                            className="absolute bottom-0 right-0 bg-white rounded-full p-2 border-2 border-white cursor-pointer hover:bg-gray-100"
                        >
                            <Camera className="h-4 w-4 text-gray-600" />
                        </label>
                    </div>
                </div>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <User className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Username
                        </label>
                        <div className="space-y-1">
                            <input
                                type="text"
                                {...register('username', {
                                    required: 'Username is required',
                                    minLength: {
                                        value: 2,
                                        message: 'Username must be at least 2 characters'
                                    }
                                })}
                                value={formData.username || ''}
                                onChange={(e) => handleChange(e)}
                                placeholder="Enter your username"
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            />
                            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <Phone className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Phone Number
                        </label>
                        <div className="space-y-1">
                            <PatternFormat
                                type="tel"
                                name="phone"
                                value={formData.phone || ''}
                                onValueChange={(values: any) => setFormData(prev => ({ ...prev, phone: values.value }))}
                                placeholder="+1 (234) 567-8900 (optional)"
                                format="+## (###) ###-####"
                                mask="_"
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500">Optional: Enter a unique phone number</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <User className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Email
                        </label>
                        <div className="space-y-1">
                            <input
                                type="email"
                                {...register('email', { required: 'Email is required' })}
                                value={formData.email || ''}
                                onChange={(e) => handleChange(e)}
                                placeholder="Enter your email"
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <User className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Bio
                        </label>
                        <div className="space-y-1">
                            <textarea
                                name="bio"
                                value={formData.bio || ''}
                                onChange={(e) => handleChange(e)}
                                placeholder="Tell us about yourself..."
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                                maxLength={50}
                                rows={3}
                            />
                            <p className="text-xs text-gray-500">Max 50 characters</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <Calendar className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Date of Birth
                        </label>
                        <div className="space-y-1">
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth || ''}
                                onChange={(e) => handleChange(e)}
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                max={new Date().toISOString().split('T')[0]}
                            />
                            <p className="text-xs text-gray-500">Optional: Enter your date of birth</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <User className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Gender
                        </label>
                        <div className="space-y-1">
                            <select
                                name="gender"
                                value={formData.gender || ''}
                                onChange={(e) => handleChange(e)}
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                            <p className="text-xs text-gray-500">Optional: Select your gender</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <User className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Father Name
                        </label>
                        <div className="space-y-1">
                            <input
                                type="text"
                                name="fatherName"
                                value={formData.fatherName || ''}
                                onChange={(e) => handleChange(e)}
                                placeholder="Enter father's name"
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500">Optional: Enter father's name</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <Tag className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Hobbies
                        </label>
                        <div className="space-y-1">
                            <HobbiesSelector
                                selectedHobbies={formData.hobbies?.map(hobby => hobby.id) || []}
                                onHobbiesChange={(hobbyIds) => {
                                    const hobbyMap = new Map(formData.hobbies?.map(h => [h.id, h.name]) || []);
                                    setFormData(prev => ({
                                        ...prev,
                                        hobbies: hobbyIds.map(id => ({
                                            id,
                                            name: hobbyMap.get(id) || ''
                                        }))
                                    }));
                                }}
                                className="mt-0"
                                sideClickClose={true}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <Shield className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            CNIC
                        </label>
                        <div className="space-y-1">
                            <input
                                type="text"
                                name="cnic"
                                value={formData.cnic || ''}
                                onChange={(e) => handleChange(e)}
                                placeholder="XXXXX-XXXXXXX-X"
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500">Optional: Format XXXXX-XXXXXXX-X (unique)</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <User className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Address
                        </label>
                        <div className="space-y-1">
                            <textarea
                                name="address"
                                value={formData.address || ''}
                                onChange={(e) => handleChange(e)}
                                placeholder="Enter your address"
                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                                rows={2}
                            />
                            <p className="text-xs text-gray-500">Optional: Enter your address</p>
                        </div>
                    </div>
                </div>


                <div className="flex space-x-4">
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={editLoading}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                        {editLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
            {showCropper && (
                <GlobalImageCropper
                    image={selectedImage || ''}
                    crop={crop}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={handleCropComplete}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                    title="Crop Profile Picture"
                    aspectRatio={1}
                    resetCropper={resetCropper}
                />
            )}
        </Fragment>
    );
}
