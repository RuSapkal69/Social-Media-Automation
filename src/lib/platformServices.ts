// lib/platformServices.ts
import axios from 'axios';

// ============================================
// INSTAGRAM SERVICE
// ============================================
export class InstagramService {
  private accessToken: string;
  private igUserId: string;

  constructor(accessToken: string, igUserId: string) {
    this.accessToken = accessToken;
    this.igUserId = igUserId;
  }

  async postImage(imageUrl: string, caption: string) {
    try {
      // Step 1: Create media container
      const containerResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.igUserId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: this.accessToken,
        }
      );

      const creationId = containerResponse.data.id;

      // Step 2: Publish the media container
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.igUserId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken,
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        platform: 'Instagram',
      };
    } catch (error: any) {
      console.error('Instagram posting error:', error.response?.data || error.message);
      throw new Error(`Instagram: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async postVideo(videoUrl: string, caption: string) {
    try {
      // Step 1: Create video container
      const containerResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.igUserId}/media`,
        {
          media_type: 'VIDEO',
          video_url: videoUrl,
          caption: caption,
          access_token: this.accessToken,
        }
      );

      const creationId = containerResponse.data.id;

      // Step 2: Poll for video processing status
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!isReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${creationId}`,
          {
            params: {
              fields: 'status_code',
              access_token: this.accessToken,
            },
          }
        );

        if (statusResponse.data.status_code === 'FINISHED') {
          isReady = true;
        } else if (statusResponse.data.status_code === 'ERROR') {
          throw new Error('Video processing failed');
        }
        attempts++;
      }

      if (!isReady) {
        throw new Error('Video processing timeout');
      }

      // Step 3: Publish the video
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.igUserId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken,
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        platform: 'Instagram',
      };
    } catch (error: any) {
      console.error('Instagram video posting error:', error.response?.data || error.message);
      throw new Error(`Instagram: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// ============================================
// LINKEDIN SERVICE
// ============================================
export class LinkedInService {
  private accessToken: string;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  async postContent(text: string, mediaUrl?: string) {
    try {
      const postData: any = {
        author: `urn:li:person:${this.userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: mediaUrl ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      if (mediaUrl) {
        // Register media upload
        const uploadResponse = await this.registerImageUpload();
        const uploadUrl = uploadResponse.uploadUrl;
        const asset = uploadResponse.asset;

        // Upload the image
        const imageBuffer = await this.downloadImage(mediaUrl);
        await axios.put(uploadUrl, imageBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            Authorization: `Bearer ${this.accessToken}`,
          },
        });

        // Add media to post
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            description: {
              text: 'Image',
            },
            media: asset,
            title: {
              text: 'Shared Image',
            },
          },
        ];
      }

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return {
        success: true,
        postId: response.data.id,
        platform: 'LinkedIn',
      };
    } catch (error: any) {
      console.error('LinkedIn posting error:', error.response?.data || error.message);
      throw new Error(`LinkedIn: ${error.response?.data?.message || error.message}`);
    }
  }

  private async registerImageUpload() {
    const response = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${this.userId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      uploadUrl: response.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
      asset: response.data.value.asset,
    };
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
}

// ============================================
// PINTEREST SERVICE
// ============================================
export class PinterestService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async createPin(imageUrl: string, title: string, description: string, boardId: string) {
    try {
      const response = await axios.post(
        'https://api.pinterest.com/v5/pins',
        {
          title: title,
          description: description,
          board_id: boardId,
          media_source: {
            source_type: 'image_url',
            url: imageUrl,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        postId: response.data.id,
        platform: 'Pinterest',
      };
    } catch (error: any) {
      console.error('Pinterest posting error:', error.response?.data || error.message);
      throw new Error(`Pinterest: ${error.response?.data?.message || error.message}`);
    }
  }
}

// ============================================
// YOUTUBE SERVICE
// ============================================
export class YouTubeService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async uploadVideo(videoUrl: string, title: string, description: string) {
    try {
      // Download video
      const videoBuffer = await this.downloadVideo(videoUrl);

      // Upload video
      const response = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          snippet: {
            title: title,
            description: description,
            categoryId: '22', // People & Blogs category
          },
          status: {
            privacyStatus: 'public',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Get upload URL from response headers
      const uploadUrl = response.headers.location;

      // Upload the actual video file
      await axios.put(uploadUrl, videoBuffer, {
        headers: {
          'Content-Type': 'video/*',
        },
      });

      return {
        success: true,
        postId: response.data.id,
        platform: 'YouTube',
      };
    } catch (error: any) {
      console.error('YouTube upload error:', error.response?.data || error.message);
      throw new Error(`YouTube: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async downloadVideo(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
}

// ============================================
// UNIFIED POSTING FUNCTION
// ============================================
export async function postToSocialMedia(
  platforms: string[],
  caption: string,
  mediaUrl: string,
  mediaType: 'image' | 'video',
  tokens: {
    instagram?: { accessToken: string; userId: string };
    linkedin?: { accessToken: string; userId: string };
    pinterest?: { accessToken: string; boardId: string };
    youtube?: { accessToken: string };
  }
) {
  const results: any[] = [];

  for (const platform of platforms) {
    try {
      switch (platform.toLowerCase()) {
        case 'instagram':
          if (tokens.instagram) {
            const igService = new InstagramService(
              tokens.instagram.accessToken,
              tokens.instagram.userId
            );
            const result = mediaType === 'image'
              ? await igService.postImage(mediaUrl, caption)
              : await igService.postVideo(mediaUrl, caption);
            results.push(result);
          }
          break;

        case 'linkedin':
          if (tokens.linkedin) {
            const liService = new LinkedInService(
              tokens.linkedin.accessToken,
              tokens.linkedin.userId
            );
            const result = await liService.postContent(caption, mediaUrl);
            results.push(result);
          }
          break;

        case 'pinterest':
          if (tokens.pinterest && mediaType === 'image') {
            const pinterestService = new PinterestService(tokens.pinterest.accessToken);
            const result = await pinterestService.createPin(
              mediaUrl,
              caption.substring(0, 100),
              caption,
              tokens.pinterest.boardId
            );
            results.push(result);
          }
          break;

        case 'youtube':
          if (tokens.youtube && mediaType === 'video') {
            const ytService = new YouTubeService(tokens.youtube.accessToken);
            const result = await ytService.uploadVideo(
              mediaUrl,
              caption.substring(0, 100),
              caption
            );
            results.push(result);
          }
          break;

        default:
          console.warn(`Platform ${platform} not supported`);
      }
    } catch (error) {
      results.push({
        success: false,
        platform,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}