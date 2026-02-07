import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, learningType, englishLevel } = body;

    // Validate required fields
    if (!name || !email || !phone || !learningType || !englishLevel) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Submit to Fillout
    const filloutResponse = await fetch('https://api.fillout.com/v1/api/forms/xxDgGsVoUTus/submissions', {
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
                id: 'jo1c',
                value: name
              },
              {
                id: '3YFn',
                value: email
              },
              {
                id: 'wUj5',
                value: phone
              },
              {
                id: '7FkX',
                value: learningType
              },
              {
                id: 'mSXZ',
                value: englishLevel
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
        { error: `Failed to submit booking request. Status: ${filloutResponse.status}. ${errorData}` },
        { status: 500 }
      );
    }

    const filloutData = await filloutResponse.json();
    console.log('Fillout submission successful:', filloutData);

    return NextResponse.json(
      { message: 'Booking request submitted successfully! We\'ll contact you soon to confirm your session.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting to Fillout:', error);
    return NextResponse.json(
      { error: 'Failed to submit booking request. Please try again.' },
      { status: 500 }
    );
  }
}
