// pages/api/upload.ts

// import multer from 'multer';
// import type { NextApiRequest, NextApiResponse } from 'next';
// import nextConnect from 'next-connect';
// import * as XLSX from 'xlsx';

// interface CustomError extends Error {
//   status?: number;
// }

// const upload = multer({ storage: multer.memoryStorage() });

// const apiRoute = nextConnect({
//         onError(error: CustomError, res: NextApiResponse) {
//             const statusCode = error.status ?? 500;
//             res.status(statusCode).json({ error: `Sorry something Happened! ${error.message}` });
//         },
//         onNoMatch(req: NextApiRequest, res: NextApiResponse) {
//             res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
//         },
//     });

// apiRoute.use(upload.single('file'));

// apiRoute.post((req: NextApiRequest, res: NextApiResponse) => {
//   const file = req.file;
//   if (!file) {
//     res.status(400).send('No file uploaded.');
//     return;
//   }

//   const workbook = XLSX.read(file.buffer, { type: 'buffer' });
//   const sheetName = workbook.SheetNames[0]; // or the specific sheet name
//   const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//   // Process jsonData with Prisma here

//   res.status(200).json({ message: 'File processed successfully', data: jsonData });
// });

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default apiRoute;
