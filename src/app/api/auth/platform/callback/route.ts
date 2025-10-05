import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';

const OAUTH_CONFIG = {
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID!,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
  },
  pinterest: {
    clientId: process.env.PINTEREST_CLIENT_ID!,
    clientSecret: process.env.PINTEREST_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/pinterest/callback`,
  },
  youtube: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`,
  },
};

export async function GET(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const { platform } = params;

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  try {
    let accessToken: string;
    let userId: string;
    let additionalData: any = {};

    switch (platform) {
      case 'instagram':
        // Exchange code for access token
        const igTokenResponse = await axios.post(
          'https://api.instagram.com/oauth/access_token',
          new URLSearchParams({
            client_id: OAUTH_CONFIG.instagram.clientId,
            client_secret: OAUTH_CONFIG.instagram.clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: OAUTH_CONFIG.instagram.redirectUri,
            code: code,
          }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        accessToken = igTokenResponse.data.access_token;
        userId = igTokenResponse.data.user_id;

        // Get long-lived token
        const longLivedResponse = await axios.get(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${OAUTH_CONFIG.instagram.clientSecret}&access_token=${accessToken}`
        );

        accessToken = longLivedResponse.data.access_token;
        additionalData.expiresIn = longLivedResponse.data.expires_in;
        break;

      case 'linkedin':
        const liTokenResponse = await axios.post(
          'https://www.linkedin.com/oauth/v2/accessToken',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: OAUTH_CONFIG.linkedin.clientId,
            client_secret: OAUTH_CONFIG.linkedin.clientSecret,
            redirect_uri: OAUTH_CONFIG.linkedin.redirectUri,
          }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        accessToken = liTokenResponse.data.access_token;

        // Get user info
        const liUserResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        userId = liUserResponse.data.sub;
        break;

      case 'pinterest':
        const pinterestTokenResponse = await axios.post(
          'https://api.pinterest.com/v5/oauth/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: OAUTH_CONFIG.pinterest.redirectUri,
          }),
          {
            auth: {
              username: OAUTH_CONFIG.pinterest.clientId,
              password: OAUTH_CONFIG.pinterest.clientSecret,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        accessToken = pinterestTokenResponse.data.access_token;

        // Get user boards
        const boardsResponse = await axios.get('https://api.pinterest.com/v5/boards', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        userId = 'pinterest_user';
        additionalData.boards = boardsResponse.data.items;
        additionalData.defaultBoardId = boardsResponse.data.items[0]?.id;
        break;

      case 'youtube':
        const ytTokenResponse = await axios.post(
          'https://oauth2.googleapis.com/token',
          new URLSearchParams({
            code: code,
            client_id: OAUTH_CONFIG.youtube.clientId,
            client_secret: OAUTH_CONFIG.youtube.clientSecret,
            redirect_uri: OAUTH_CONFIG.youtube.redirectUri,
            grant_type: 'authorization_code',
          }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        accessToken = ytTokenResponse.data.access_token;
        additionalData.refreshToken = ytTokenResponse.data.refresh_token;

        // Get channel info
        const channelResponse = await axios.get(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        userId = channelResponse.data.items[0]?.id || 'youtube_user';
        break;

      default:
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Store tokens in Supabase
    const { error } = await supabase.from('platform_tokens').upsert(
      {
        platform: platform,
        access_token: accessToken,
        user_id: userId,
        additional_data: additionalData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'platform' }
    );

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: 'Failed to save tokens' }, { status: 500 });
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/success?platform=${platform}`);
  } catch (error: any) {
    console.error(`${platform} OAuth error:`, error.response?.data || error.message);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?platform=${platform}&error=${encodeURIComponent(error.message)}`
    );
  }
}