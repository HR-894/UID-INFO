# Free Fire Player Info Scraper API

This is a serverless API built with Node.js to scrape player profile information from a Free Fire info website using the player's UID.

It's designed to be deployed on Vercel and is compatible with the Node.js 22.x runtime.

## API Endpoint

**Method**: `GET`

**URL**: `/api/ffinfo`

### Query Parameters

- `uid` (required): The Free Fire player's UID.

**Example Request**:
```
https://<your-vercel-deployment-url>/api/ffinfo?uid=123456789
```

### Success Response (200 OK)

```json
{
  "uid": "123456789",
  "nickname": "PlayerName",
  "likes": 120,
  "level": 67,
  "experience": 43210,
  "honor_score": 100,
  "br_rank": "Heroic",
  "br_points": 3456,
  "cs_rank": "Diamond IV",
  "cs_points": 2200,
  "last_login": "2025-08-30 14:32",
  "account_created": "2021-01-15",
  "bio": "Pro player 🔥",
  "booyah_pass_level": 35,
  "equipped_pet": "Panda",
  "guild": {
     "name": "Warriors",
     "id": "123456",
     "role": "Member"
  }
}
```

### Error Response (404 Not Found)

```json
{
  "error": "Player not found or invalid UID."
}
```

## How to Deploy on Vercel

1.  **Push to GitHub**: Create a new repository on GitHub and push all these files (`package.json`, `vercel.json`, `api/`, `public/`, `.gitignore`, `README.md`).
2.  **Import to Vercel**: Go to your Vercel dashboard, click "Add New..." -> "Project".
3.  **Connect Repository**: Import the GitHub repository you just created.
4.  **Deploy**: Vercel will automatically detect the project settings from `package.json` and `vercel.json`. Click the "Deploy" button.

That's it! Your API will be live.

## Local Development

1.  Install Vercel CLI: `npm install -g vercel`
2.  Install dependencies: `npm install`
3.  Run the development server: `vercel dev`

The application will be available at `http://localhost:3000`.
