# Textile-backend

## Setup, build, run

remove "example" from before the name of the example.env.local file, and change to your user_group keys from textile hub.
or in textile-backend folder, create a .env.local file with
PORT=3000
USER_API_KEY=...
USER_API_SECRET=...

open the textile-backend folder in terminal

```bash
npm install
npm run build
npm run dev
```

Should print in the terminal that the server is running on the PORT number