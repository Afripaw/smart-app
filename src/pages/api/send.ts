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
import { text } from "stream/consumers";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { firstName, email, id, password, typeOfUser } = req.body as { firstName: string; email: string; id: string; password: string; typeOfUser: string };

  // Render the email template to an HTML string
  //const emailHtml = ReactDOMServer.renderToString(<EmailTemplate firstName={firstName} />);
  const text_owner =
    "Dear " +
    firstName +
    ",\n\n" +
    "Congratulations, you have been registered as a Pet Owner on the AfriPaw Smart App." +
    "\nYour owner ID is: " +
    "U" +
    id +
    ". Please present this number at AfriPaw Pet Clinics to identify yourself." +
    "\n" +
    "You indicated that your preferred means of communication is: Email." +
    "\n\n" +
    "Regards,\n" +
    "AfriPaw Team";
  const text_volunteer =
    "Dear " +
    firstName +
    ",\n\n" +
    "Congratulations, you have been registered as a volunteer on the AfriPaw Smart App." +
    "\nYour volunteer ID is: " +
    "V" +
    id +
    "\n" +
    "You indicated that your preferred means of communication is: Email." +
    "\n\n" +
    "Regards,\n" +
    "AfriPaw Team";
  const text_user =
    "Dear " +
    firstName +
    ",\n\n" +
    "Congratulations, you have been registered as a user on the AfriPaw Smart App." +
    "\n" +
    "The app may be accessed at: afripaw.app\n" +
    "Your user ID is: " +
    "U" +
    id +
    "\n" +
    "Your password is: " +
    password +
    "\n\n" +
    "Regards,\n" +
    "AfriPaw Team";
  //You indicated that your preferred means of communication is: SMS.
  let text = "";
  if (typeOfUser === "owner") {
    text = text_owner;
  } else if (typeOfUser === "volunteer") {
    text = text_volunteer;
  } else {
    text = text_user;
  }

  //Acme <onboarding@resend.dev>
  const { data, error } = await resend.emails.send({
    from: "Afripaw <onboarding@resend.dev>",
    to: [email],
    subject: "Afripaw Smart App Login Credentials",
    // html: emailHtml, // Use the rendered HTML string
    // text: "Dear " + firstName + ",\n\n" + "Congratulations, you have been registered as a Here is your user credentials: \n\n" + "User ID: " + id + "\n" + "Password: " + password,
    text: text,
  });

  if (error) {
    console.error("Error sending email:", error);
    return res.status(400).json({ message: "Failed to send email", error });
  }

  res.status(200).json({ message: "Email sent successfully", data });
};
