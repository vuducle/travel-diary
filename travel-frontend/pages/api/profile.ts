import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PATCH') {
    const form = formidable({});

    form.parse(req, (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Error parsing form data' });
        return;
      }
      console.log('fields:', fields);
      console.log('files:', files);
      res.status(200).json({ message: 'Profile updated successfully' });
    });
  } else {
    res.setHeader('Allow', ['PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
