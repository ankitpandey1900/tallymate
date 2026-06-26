"use server";

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "missing_key_fallback");

export async function sendContactMessage(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { success: false, error: "All fields are required." };
  }

  try {
    const { data, error } = await resend.emails.send({
      // Resend free tier requires sending FROM the onboarded domain or onboarding@resend.dev
      from: 'Tallymate Contact Form <onboarding@resend.dev>',
      // The email it's sent TO must be the one you registered with Resend (on the free tier)
      to: process.env.CONTACT_EMAIL_TO || 'hello@example.com', 
      subject: `New Message from ${name} via Tallymate`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { success: false, error: "Failed to send message. Please try again later." };
    }

    return { success: true };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, error: "Something went wrong." };
  }
}
