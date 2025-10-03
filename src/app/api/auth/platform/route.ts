// app/api/auth/[platform]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Environment variables for OAuth credentials
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
  const { platform } = params;

  switch (platform) {
    case 'instagram':
      // Instagram uses Facebook Login
      const igAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${OAUTH_CONFIG.instagram.clientId}&redirect_uri=${OAUTH_CONFIG.instagram.redirectUri}&scope=instagram_basic,instagram_content_publish&response_type=code`;
      return NextResponse.redirect(igAuthUrl);

    case 'linkedin':
      const liAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${OAUTH_CONFIG.linkedin.clientId}&redirect_uri=${OAUTH_CONFIG.linkedin.redirectUri}&scope=openid%20profile%20w_member_social`;
      return NextResponse.redirect(liAuthUrl);

    case 'pinterest':
      const pinterestAuthUrl = `https://www.pinterest.com/oauth/?client_id=${OAUTH_CONFIG.pinterest.clientId}&redirect_uri=${OAUTH_CONFIG.pinterest.redirectUri}&response_type=code&scope=boards:read,pins:read,pins:write`;
      return NextResponse.redirect(pinterestAuthUrl);

    case 'youtube':
      const ytAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${OAUTH_CONFIG.youtube.clientId}&redirect_uri=${OAUTH_CONFIG.youtube.redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline`;
      return NextResponse.redirect(ytAuthUrl);

    default:
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }
}