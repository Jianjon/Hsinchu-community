import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

/**
 * Service for handling file uploads to Firebase Storage
 */
export const storageService = {
    /**
     * Upload a base64 string (data URL) to Firebase Storage
     * @param base64String The data URL from a canvas or reader
     * @param path The destination path in storage
     */
    uploadBase64: async (base64String: string, path: string): Promise<string> => {
        if (!storage) throw new Error('Firebase Storage not initialized');

        const storageRef = ref(storage, path);

        // Remove the data URL prefix if it exists
        const format = base64String.split(';')[0].split(':')[1]; // e.g. "image/jpeg"
        const data = base64String.includes(',') ? base64String.split(',')[1] : base64String;

        const snapshot = await uploadString(storageRef, data, 'base64', {
            contentType: format
        });

        return getDownloadURL(snapshot.ref);
    },

    /**
     * Upload a File object to Firebase Storage
     * @param file File from an input 
     * @param path The destination path
     */
    uploadFile: async (file: File, path: string): Promise<string> => {
        if (!storage) throw new Error('Firebase Storage not initialized');

        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);

        return getDownloadURL(snapshot.ref);
    },

    /**
     * Generate a unique path for an image/video
     * @param userId Current user ID
     * @param filename Clean filename
     */
    generatePath: (userId: string, filename: string): string => {
        const timestamp = Date.now();
        const cleanName = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        return `uploads/${userId}/${timestamp}_${cleanName}`;
    }
};
