/*import axios, { AxiosError } from 'axios';

const accountApiCredentials: string = process.env.SMS_API_KEY + ':' + process.env.SMS_API_SECRET;

const buff: Buffer = Buffer.from(accountApiCredentials, 'utf-8');
const base64Credentials: string = buff.toString('base64');

const requestHeaders = {
    headers: {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/json' 
    }
};

const requestData = JSON.stringify({
    messages: [{
        content: "Hello SMS World from NodeJS",
        destination: ">>Your test phone number<<"
    }]
});

axios.post('https://rest.smsportal.com/bulkmessages', requestData, requestHeaders)

    .then(response => {
        if (response.data) {
            console.log("Success:");
            console.log(response.data);
        }
    })
    .catch((error: AxiosError) => {
        if (error.response) {
            console.log("Failure:");
            console.log(error.response.data);
        } else {
            console.log("Something went wrong during the network request.");
        }
    });*/

// smsPortal.ts
import axios, { AxiosError } from "axios";

async function sendSMS(content: string, destination: string): Promise<void> {
  const SMS_API_KEY = "e02b218f-3fc5-4f32-bb09-67781504ec39";
  const SMS_API_SECRET = "4aae09dc-2803-4d64-a4f8-af714740a83a";
  const accountApiCredentials: string = SMS_API_KEY + ":" + SMS_API_SECRET;
  const buff: Buffer = Buffer.from(accountApiCredentials, "utf-8");
  const base64Credentials: string = buff.toString("base64");

  const requestHeaders = {
    headers: {
      Authorization: `Basic ${base64Credentials}`,
      "Content-Type": "application/json",
    },
  };

  const requestData = JSON.stringify({
    messages: [
      {
        content: content,
        destination: destination,
      },
    ],
  });

  axios
    .post("https://rest.smsportal.com/bulkmessages", requestData, requestHeaders)
    .then((response) => {
      if (response.data) {
        console.log("SMS Success:");
        console.log(response.data);
      }
    })
    .catch((error: AxiosError) => {
      if (error.response) {
        console.error("SMS Failure:");
        console.log(error.response.data);
      } else {
        console.error("Something went wrong during the SMS network request.");
      }
    });
}

export { sendSMS };
