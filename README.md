# sentiment-analysis-backend

![TypeScript](https://img.shields.io/badge/-TypeScript-blue?logo=typescript&logoColor=white) ![License](https://img.shields.io/badge/license-ISC-green)

## 📝 Description

Dive into the emotional landscape of news articles with sentiment-analysis-backend, a robust API built with Express.js and TypeScript. This backend service analyzes news content, providing valuable insights into the overall sentiment expressed. Built for web integration, it allows developers to easily incorporate sentiment analysis capabilities into their applications, empowering users to understand the emotional tone behind the headlines.

## ✨ Features

- 🕸️ Web


## 🛠️ Tech Stack

- 🚀 Express.js
- 📜 TypeScript


## 📦 Key Dependencies

```
@prisma/client: ^6.18.0
@prisma/extension-accelerate: ^2.0.2
bcryptjs: ^3.0.2
dotenv: ^17.2.2
express: ^5.1.0
jsonwebtoken: ^9.0.2
morgan: ^1.10.1
nodemon: ^3.1.10
winston: ^3.17.0
winston-daily-rotate-file: ^5.0.0
winston-transport: ^4.9.0
zod: ^4.1.9
```

## 🚀 Run Commands

- **db:generate**: `npm run db:generate`
- **build**: `npm run build`
- **start**: `npm run start`
- **dev**: `npm run dev`
- **postinstall**: `npm run postinstall`


## 📁 Project Structure

```
.
├── package.json
├── prisma
│   ├── migrations
│   │   ├── 20250920060631_intial_commit
│   │   │   └── migration.sql
│   │   ├── 20251021164417_sentiment_table_seperated
│   │   │   └── migration.sql
│   │   ├── 20251024034500_sentiment_table_updated
│   │   │   └── migration.sql
│   │   ├── 20251024081306_add_photo
│   │   │   └── migration.sql
│   │   ├── 20251028204509_sectors
│   │   │   └── migration.sql
│   │   ├── 20251030061209_score
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── sql
│       └── getSearchOutput.sql
├── src
│   ├── config
│   │   └── prisma.ts
│   ├── controllers
│   │   ├── authController.ts
│   │   ├── companyAnalysisController.ts
│   │   ├── dashboardStatsController.ts
│   │   ├── searchController.ts
│   │   └── uploader.ts
│   ├── index.ts
│   ├── lib
│   │   ├── constants.ts
│   │   └── logger.ts
│   ├── middlewares
│   │   ├── authMiddleware.ts
│   │   ├── httpLogger.ts
│   │   └── zodMiddleware.ts
│   ├── routes
│   │   ├── authRoute.ts
│   │   ├── companyAnalysis.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── searchRoutes.ts
│   │   └── uploader.ts
│   └── types
│       ├── all.ts
│       ├── express
│       │   └── express.d.ts
│       └── zod
│           └── types.ts
├── tsconfig.json
└── vercel.json
```

## 👥 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/Bhoumik09/sentiment-analysis-backend.git`
3. **Create** a new branch: `git checkout -b feature/your-feature`
4. **Commit** your changes: `git commit -am 'Add some feature'`
5. **Push** to your branch: `git push origin feature/your-feature`
6. **Open** a pull request

Please ensure your code follows the project's style guidelines and includes tests where applicable.

## 📜 License

This project is licensed under the ISC License.

---
*This README was generated with ❤️ by ReadmeBuddy*
