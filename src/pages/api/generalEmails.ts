// pages/api/send.ts
import type { NextApiRequest, NextApiResponse } from "next";
//import ReactDOMServer from "react-dom/server";
//import EmailTemplate from "~/components/emailTemplate";
import { Resend } from "resend";
//import { text } from "stream/consumers";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { message, email } = req.body as { message: string; email: string };

  // Render the email template to an HTML string
  //const emailHtml = ReactDOMServer.renderToString(<EmailTemplate firstName={firstName} />);

  //Acme <onboarding@resend.dev>
  const { data, error } = await resend.emails.send({
    from: "Afripaw <info@afripaw.app>",
    to: [email],
    subject: "Afripaw Smart App Login Credentials",
    // html: emailHtml, // Use the rendered HTML string
    // text: "Dear " + firstName + ",\n\n" + "Congratulations, you have been registered as a Here is your user credentials: \n\n" + "User ID: " + id + "\n" + "Password: " + password,
    text: message,
  });

  if (error) {
    console.error("Error sending email:", error);
    return res.status(400).json({ message: "Failed to send email", error });
  }

  res.status(200).json({ message: "Email sent successfully", data });
};
