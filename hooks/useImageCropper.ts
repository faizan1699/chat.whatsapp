'use client';

import { useState, useCallback } from 'react';
import { Area, Point } from 'react-easy-crop';

interface UseImageCropperReturn {
    selectedImage: string | null;
    croppedImage: string | null;
    showCropper: boolean;
    crop: Point;
    zoom: number;
    setCrop: (crop: Point) => void;
    setZoom: (zoom: number) => void;
    handleImageSelect: (file: File) => void;
    handleCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
    handleCropConfirm: () => void;
    handleCropCancel: () => void;
    resetCropper: () => void;
    convertBlobToBase64: (blob: Blob) => Promise<string>;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return '';
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                resolve('');
                return;
            }
            resolve(URL.createObjectURL(blob));
        }, 'image/jpeg');
    });
};

export function useImageCropper(): UseImageCropperReturn {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const convertBlobToBase64 = useCallback((blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }, []);

    const handleImageSelect = useCallback((file: File) => {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert('Image size should be less than 10MB');
            return;
        }

        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        setShowCropper(true);
        setCroppedImage(null);
    }, []);

    const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropConfirm = useCallback(async () => {
        if (!croppedAreaPixels || !selectedImage) return;

        try {
            const croppedImageUrl = await getCroppedImg(selectedImage, croppedAreaPixels);
            
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();
            const base64 = await convertBlobToBase64(blob);
            
            setCroppedImage(base64);
            setShowCropper(false);
            
            URL.revokeObjectURL(selectedImage);
            URL.revokeObjectURL(croppedImageUrl);
            setSelectedImage(null);
        } catch (error) {
            console.error('Error cropping image:', error);
            alert('Failed to crop image');
        }
    }, [croppedAreaPixels, selectedImage, convertBlobToBase64]);

    const handleCropCancel = useCallback(() => {
        setShowCropper(false);
        if (selectedImage) {
            URL.revokeObjectURL(selectedImage);
            setSelectedImage(null);
        }
        setCroppedImage(null);
    }, [selectedImage]);

    const resetCropper = useCallback(() => {
        setSelectedImage(null);
        setCroppedImage(null);
        setShowCropper(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    }, []);

    return {
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
        convertBlobToBase64,
    };
}
