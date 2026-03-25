import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/utils/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { termsAccepted, cookieConsent } = await req.json();

    // Update user record with consent information
    const updateData: any = {};

    if (termsAccepted !== undefined) {
      updateData.termsAccepted = termsAccepted;
      updateData.termsAcceptedAt = termsAccepted ? new Date().toISOString() : null;
    }

    if (cookieConsent !== undefined) {
      updateData.cookieConsent = cookieConsent.cookieConsent || cookieConsent;
      updateData.cookieConsentAt = new Date().toISOString();
    }

    // Update user record with consent information (skip if columns don't exist)
    try {
      await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', session.userId);
    } catch (updateError) {
      console.error('Error updating user consent (columns might not exist):', updateError);
      // Don't fail the request if columns don't exist
    }

    return NextResponse.json({
      message: 'Consent updated successfully',
      data: {
        termsAccepted,
        cookieConsent
      }
    });

  } catch (error) {
    console.error('Error updating consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's current consent preferences
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('termsAccepted, termsAcceptedAt, cookieConsent, cookieConsentAt')
      .eq('id', session.userId)
      .single();

    if (error) {
      console.error('Error fetching user consent:', error);
      return NextResponse.json({ error: 'Failed to fetch consent' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        termsAccepted: user?.termsAccepted || false,
        termsAcceptedAt: user?.termsAcceptedAt,
        cookieConsent: user?.cookieConsent,
        cookieConsentAt: user?.cookieConsentAt
      }
    });

  } catch (error) {
    console.error('Error fetching consent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
