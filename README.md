# 🍔 Food Menu Service — Docker CI/CD on AWS Fargate

> **Learning project** built following the [Zero to Cloud course](https://learn.zerotocloud.co/courses/2924908/lectures/64304892) — a hands-on exercise in containerizing a Node.js app and deploying it to AWS with a fully automated CI/CD pipeline.

A simple food delivery menu service (Express + static frontend) used to practice the full container deployment lifecycle. The same Docker image is:

- 🔄 **Used in CI/CD pipelines** (GitHub Actions)
- 📦 **Pushed to Amazon ECR** (Elastic Container Registry)
- 🚀 **Deployed on ECS Fargate** (serverless containers, no EC2 to manage)
- ♻️ **Updated using zero-downtime deployments** (rolling deployment behind an ALB)

## Architecture

```
git push (main)
     │
     ▼
GitHub Actions ──► docker build ──► push to Amazon ECR (:latest)
     │
     ▼
aws ecs update-service --force-new-deployment
     │
     ▼
ECS Fargate (food-menu-cluster) ──► new task pulls :latest
     │
     ▼
Application Load Balancer ──► drains old task, routes to new one
     │
     ▼
users see the new version — zero downtime
```

## Steps completed in this project

### 1. Build the app
A small Express server (`server.js`) exposing:

| Endpoint | Purpose |
|---|---|
| `/` | Static frontend (`public/index.html`) |
| `/api/menu` | Menu items as JSON |
| `/health` | Health check used by the ALB target group |
| `/version` | App version, used to validate CI/CD deployments |

### 2. Dockerize the application
`Dockerfile` based on `node:18-alpine`, exposing port 3000.

```bash
docker build --platform linux/amd64 -t food-site .
docker run -p 3000:3000 food-site
```

### 3. Push the image to Amazon ECR
```bash
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com
docker tag food-site:latest <ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com/food-site:latest
docker push <ACCOUNT_ID>.dkr.ecr.eu-central-1.amazonaws.com/food-site:latest
```

### 4. Deploy on ECS Fargate
- ECS cluster: `food-menu-cluster`
- Task definition: `food-site-task` — **important:** the container image must reference the ECR repo by **tag** (`food-site:latest`), not by digest (`@sha256:...`), otherwise new deployments keep running the old frozen image
- Service: `food-site-task-service` (1 task) behind an **Application Load Balancer** with health checks on `/health`

### 5. CI/CD with GitHub Actions
`.github/workflows/deploy.yml` runs on every push to `main`:

1. Checkout the code
2. Configure AWS credentials (from repo secrets)
3. Login to Amazon ECR
4. Build and tag the Docker image
5. Push the image to ECR
6. `aws ecs update-service --force-new-deployment` — ECS starts new tasks with the fresh `:latest` image while the ALB drains the old ones (zero downtime)

Required repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ACCOUNT_ID`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`.

## Run locally

```bash
npm install
npm start
# open http://localhost:3000
```

## Lessons learned

- A task definition that pins the image by **digest** never picks up new pushes — `--force-new-deployment` just restarts the same frozen image. Use a tag (or register a new task definition revision per build).
- `git push` is rejected with `(fetch first)` when the remote has commits you don't have locally — fix with `git pull --rebase origin main` and push again.
- For production, prefer unique image tags per build (e.g., the commit SHA) over a mutable `:latest`, so you always know what is running and can roll back easily.
