import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Submit to Fillout - try simpler format
    const filloutResponse = await fetch('https://api.fillout.com/v1/api/forms/sNJQxxgbHGus/submissions', {
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
                id: 'cFLZ',
                value: name
              },
              {
                id: 'dfXz',
                value: email
              },
              {
                id: 'q9PG',
                value: subject
              },
              {
                id: '7mZf',
                value: message
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
        { error: `Failed to submit form. Status: ${filloutResponse.status}. ${errorData}` },
        { status: 500 }
      );
    }

    const filloutData = await filloutResponse.json();
    console.log('Fillout submission successful:', filloutData);

    return NextResponse.json(
      { message: 'Message sent successfully! We\'ll get back to you soon.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting to Fillout:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}