import { supabase } from '@/lib/Supabase/browser-client';
import { awardXP } from '@/lib/services/gamification';

export interface UploadHotspotPhotoResult {
  success: boolean;
  message: string;
  id?: string;
  signedUrl?: string;
}

export async function uploadHotspotPhoto({
  userId,
  hotspotId,
  file,
  caption = '',
  visibility = 'shared' as 'private' | 'shared' | 'public',
}: {
  userId: string;
  hotspotId: string;
  file: File;
  caption?: string;
  visibility?: 'private' | 'shared' | 'public';
}): Promise<UploadHotspotPhotoResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${hotspotId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    // Upload to Supabase Storage (assume 'hotspot-photos' bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hotspot-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError || !uploadData.path) {
      console.error('Upload error:', uploadError);
      return { success: false, message: 'Failed to upload image' };
    }

    // Insert into hotspot_media table
    const { data: mediaData, error: insertError } = await supabase
      .from('hotspot_media')
      .insert({
        hotspot_id: hotspotId,
        user_id: userId,
        file_path: uploadData.path,
        caption,
        visibility,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      // Cleanup storage on insert error
      await supabase.storage.from('hotspot-photos').remove([uploadData.path]);
      console.error('Insert error:', insertError);
      return { success: false, message: 'Failed to save image metadata' };
    }

    // Award XP
    await awardXP(userId, 'xp_uploading_photo');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hotspot-photos')
      .getPublicUrl(uploadData.path);

    return {
      success: true,
      message: 'Photo uploaded successfully',
      id: mediaData.id,
      signedUrl: publicUrl,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, message: 'Upload failed. Please try again.' };
  }
}

// Batch upload for multiple files
export async function uploadHotspotPhotos(hotspotId: string, userId: string, files: File[], caption: string, visibility: 'private' | 'shared' | 'public' = 'shared') {
  const results = [];
  for (const file of files) {
    const result = await uploadHotspotPhoto({ userId, hotspotId, file, caption, visibility });
    results.push(result);
  }
  return results;
}
