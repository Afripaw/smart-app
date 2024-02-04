// // pages/api/send.ts
// import type { NextApiRequest, NextApiResponse } from 'next';
// import ReactDOMServer from 'react-dom/server';
// //import { EmailTemplate } from '~/components/emailTemplate';
// import { Resend } from 'resend';
// import React from 'react';
// import { EmailTemplate } from '~/components/emailTemplate'; // Import the missing 'EmailTemplate' component

// const resend = new Resend(process.env.RESEND_API_KEY);

// export default async (req: NextApiRequest, res: NextApiResponse) => {
//   // Assuming the request body includes the firstName and the recipient's email
// const { firstName, email } = req.body;

// // Convert your React component to a string of HTML
// const emailHtml = ReactDOMServer.renderToString(<EmailTemplate firstName={firstName} />); // Fix the JSX syntax error by wrapping the JSX element in parentheses

//   try {
//     const { data, error } = await resend.emails.send({
//       from: 'Acme <onboarding@resend.dev>',
//       to: [email], // Use the email from the request
//       subject: 'Hello world',
//       html: emailHtml, // Use the rendered HTML string
//     });

//     if (error) {
//       return res.status(400).json(error);
//     }

//     res.status(200).json(data);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to send email', error });
//   }
// };

// import type { NextApiRequest, NextApiResponse } from "next";
// import { EmailTemplate } from "~/components/emailTemplate";
// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export default async (req: NextApiRequest, res: NextApiResponse) => {
//   const { data, error } = await resend.emails.send({
//     from: "Acme <onboarding@resend.dev>",
//     to: ["delivered@resend.dev"],
//     subject: "Hello world",
//     react: EmailTemplate({ firstName: "John" }),
//     text: "Hello world", // Add the missing 'text' property
//   });

//   if (error) {
//     return res.status(400).json(error);
//   }

//   res.status(200).json(data);
// };

// pages/api/send.ts
import type { NextApiRequest, NextApiResponse } from "next";
//import ReactDOMServer from "react-dom/server";
//import EmailTemplate from "~/components/emailTemplate";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { firstName, email, id, password } = req.body as { firstName: string; email: string; id: string; password: string };

  // Render the email template to an HTML string
  //const emailHtml = ReactDOMServer.renderToString(<EmailTemplate firstName={firstName} />);

  //Acme <onboarding@resend.dev>
  const { data, error } = await resend.emails.send({
    from: "Afripaw <onboarding@resend.dev>",
    to: [email],
    subject: "AFRIPAW CREDENTIALS",
    // html: emailHtml, // Use the rendered HTML string
    text: "Hello " + firstName + ". " + "Here is your user credentials: \n\n" + "User ID: " + id + "\n" + "Password: " + password,
  });

  if (error) {
    console.error("Error sending email:", error);
    return res.status(400).json({ message: "Failed to send email", error });
  }

  res.status(200).json({ message: "Email sent successfully", data });
};
