import { Resend } from "resend";

// Initialize Resend with your API key
const resend = new Resend("re_TSnfYa5W_DJ9XL6DbvqCsBqg7EtRbDuc7");

// Function to send email to the given user email
export async function sendUserCredentialsEmail(userEmail: string): Promise<void> {
  try {
    // Call the Resend email sending method
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: userEmail,
      subject: "Your Credentials",
      html: "<p>Here are your credentials. Please keep them safe!</p>",
    });

    // Log or handle the response as needed
    console.log("Email sent successfully:", response);
  } catch (error) {
    // Handle any errors
    console.error("Failed to send email:", error);
  }
}

// Example usage: sendUserCredentialsEmail('afripawdevelop@gmail.com');
