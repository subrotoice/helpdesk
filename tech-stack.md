# Tech Stack

## Frontend

- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for client-side routing

## Backend

- **Node.js** with **Express** and **TypeScript**
- **REST APIs**

## Authentication

- **Database sessions** (session records stored in PostgreSQL)

## Database

- **PostgreSQL**

## ORM

- **Prisma**

## Email

- **Resend** for outbound emails (replies sent to students)
- **Resend Inbound** (webhook) for receiving support emails and converting them into tickets

## AI

- **Anthropic Claude API** (`@anthropic-ai/sdk`)
- Used for ticket classification, summaries, suggested replies, and knowledge-base-driven auto-responses
- Prompt caching enabled for the knowledge base to reduce cost on repeated calls

## Deployment

- **Docker** + a cloud provider
