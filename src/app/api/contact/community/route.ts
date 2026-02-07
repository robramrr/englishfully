import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Submit to Fillout
    const filloutResponse = await fetch('https://api.fillout.com/v1/api/forms/py3CgSk8VVus/submissions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk_prod_1Ltp0cj8tOTiKvRz4qAfMRY6bUenAh7qZPDCnl3y9yraBQ5jEDiLLLWC8OeVZuTfaVbSFntAVaO45SBib67RhCzWcoF6j3RqNEc_31712`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        submissions: [
          {
            questions: [
              {
                id: 'kecJ',
                value: email
              }
            ]
          }
        ]
      }),
    });

    if (!filloutResponse.ok) {
      const errorData = await filloutResponse.text();
      console.error('Fillout API error:', {
        status: filloutResponse.status,
        statusText: filloutResponse.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: `Failed to subscribe. Status: ${filloutResponse.status}. ${errorData}` },
        { status: 500 }
      );
    }

    const filloutData = await filloutResponse.json();
    console.log('Fillout submission successful:', filloutData);

    return NextResponse.json(
      { message: 'Successfully subscribed to community updates!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting to Fillout:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
