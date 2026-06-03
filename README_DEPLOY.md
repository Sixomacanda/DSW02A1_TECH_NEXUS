Deployment instructions

1) Build and run locally with Docker

```bash
docker build -t myapp:local .
docker run -p 3000:3000 -e PORT=3000 myapp:local
```

2) Publish image to GitHub Container Registry via GitHub Actions
- Push to branch `main` or `AmahleNgcobo` and the workflow will build and push to GHCR as `ghcr.io/<owner>/<repo>:latest`.
- Ensure repository `Packages` permissions allow `GITHUB_TOKEN` to publish (in repo settings -> Actions -> General).

3) Deploy the image to any container host
- You can use Render, Railway, DigitalOcean App Platform, Azure App Service (container), etc. Point the host to `ghcr.io/<owner>/<repo>:latest` and set `PORT` env var.

4) Alternative: deploy via Render direct from GitHub
- Create a new Web Service in Render, connect your GitHub repo, set branch (`AmahleNgcobo` or `main`), and set the start command to `npm start`.
- Add any required environment variables or service account JSON as a secret in Render.
