import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

// Create a bucket in Supabase Storage called 'marketplace-images'
const BUCKET_NAME = 'marketplace-images';

// Request media library permissions
export const requestMediaLibraryPermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

// Pick image from gallery
export const pickImage = async () => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      return { uri: result.assets[0].uri, error: null };
    }
    
    return { uri: null, error: null }; // User canceled
  } catch (error) {
    console.error('Error picking image:', error);
    return { uri: null, error };
  }
};

// Upload image to Supabase Storage
export const uploadImage = async (imageUri) => {
  try {
    if (!imageUri) {
      throw new Error('No image URI provided');
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated. Please log in again.');
    }

    console.log('User authenticated for upload:', user.id);

    // Get the file extension
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('Attempting upload with filename:', fileName);

    // Method 1: Try with file object (React Native compatible)
    try {
      const file = {
        uri: imageUri,
        type: `image/${fileExt}`,
        name: fileName,
      };

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL and verify it's correct
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Generated public URL:', publicUrl);

      return { url: publicUrl, error: null };

    } catch (firstError) {
      console.log('First method failed:', firstError);
      
      // Don't try FormData if it's an RLS issue
      if (firstError.message?.includes('row-level security policy')) {
        throw new Error('Permission denied: Storage upload not allowed. Please check storage policies.');
      }
      
      console.log('Trying FormData method...');
      
      // Method 2: Try with FormData (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileExt}`,
        name: fileName,
      });

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, formData, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('FormData upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('FormData generated public URL:', publicUrl);

      return { url: publicUrl, error: null };
    }

  } catch (error) {
    console.error('Error uploading image:', error);
    return { url: null, error };
  }
};

// Test if storage bucket is accessible
export const testStorageAccess = async () => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });

    if (error) {
      console.error('Storage access test failed:', error);
      return { accessible: false, error };
    }

    console.log('Storage access test passed');
    return { accessible: true, error: null };
  } catch (error) {
    console.error('Storage access test error:', error);
    return { accessible: false, error };
  }
};

// Test if an image URL is accessible
export const testImageUrl = async (imageUrl) => {
  try {
    if (!imageUrl) return { accessible: false, error: 'No URL provided' };
    
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const accessible = response.ok;
    
    console.log(`Image URL test - ${imageUrl}: ${accessible ? 'accessible' : 'not accessible'}`);
    return { accessible, error: accessible ? null : `HTTP ${response.status}` };
  } catch (error) {
    console.log(`Image URL test failed - ${imageUrl}: ${error.message}`);
    return { accessible: false, error: error.message };
  }
};

// Delete image from Supabase Storage
export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return { success: false, error: 'No image URL provided' };

    // Extract file path from URL
    const urlParts = imageUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
    if (urlParts.length !== 2) {
      throw new Error('Invalid image URL format');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error };
  }
}; 