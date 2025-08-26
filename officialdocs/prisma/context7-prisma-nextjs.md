# Prisma with Next.js - Context7 Documentation

Source: Context7 MCP Server from `/prisma/docs` (Official Prisma Documentation)

## Quick Setup

### 1. Initialize Prisma
```bash
# Initialize Prisma with database and custom output
npx prisma init --db --output ../app/generated/prisma
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Database Migration
```bash
npx prisma migrate dev --name init
```

## Schema Configuration

### 1. Basic Prisma Schema
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  authorId  Int
  author    User    @relation(fields: [authorId], references: [id])
}
```

### 2. Edge Runtime Configuration
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
  runtime  = "edge-light"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Next.js Integration Examples

### 1. Create Post Page with Server Actions
```tsx
import Form from "next/form";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default function NewPost() {
  async function createPost(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    await prisma.post.create({
      data: {
        title,
        content,
        authorId: 1,
      },
    });

    revalidatePath("/posts");
    redirect("/posts");
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      <Form action={createPost} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter your post title"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-lg mb-2">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            placeholder="Write your post content here..."
            rows={6}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
        >
          Create Post
        </button>
      </Form>
    </div>
  );
}
```

### 2. Basic Home Page Component
```tsx
export default function Home() {
  return (
    <div className="container mx-auto p-4">
      {/* Your application content */}
    </div>
  )
}
```

## Package.json Configuration

### 1. Complete Package Configuration
```json
{
  "name": "nextjs-prisma",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "postinstall": "prisma generate --no-engine",
    "start": "next start",
    "lint": "next lint"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^6.2.1",
    "@prisma/extension-accelerate": "^1.2.1",
    "next": "15.1.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.1.4",
    "postcss": "^8",
    "prisma": "^6.2.1",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.19.2",
    "typescript": "^5"
  }
}
```

### 2. Monorepo Configuration
```json
{
  "scripts": {
    "prisma:generate": "prisma generate --schema=./packages/db/schema.prisma"
  }
}
```

### 3. CI/CD Build Script
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## Migration Commands

### 1. Initial Migration
```bash
npx prisma migrate dev --name init
```

### 2. Named Migration
```bash
npx prisma migrate dev --name added-tags
```

### 3. Generate Migration SQL
```bash
npx prisma migrate diff \
--from-empty \
--to-schema-datamodel prisma/schema.prisma \
--script > prisma/migrations/0_init/migration.sql
```

### 4. Database Pull (Introspection)
```bash
npx prisma db pull
```

## Next.js Starter Examples

### 1. Standard Webpack Setup
```bash
npx create-next-app@latest --example https://github.com/prisma/prisma-examples/tree/latest/generator-prisma-client/nextjs-starter-webpack my-next-app
```

### 2. Turbopack Setup
```bash
npx create-next-app@latest --example https://github.com/prisma/prisma-examples/tree/latest/generator-prisma-client/nextjs-starter-turbopack my-next-app-turbopack
```

### 3. Monorepo Setup
```bash
pnpm create next-app --example https://github.com/prisma/prisma-examples/tree/latest/generator-prisma-client/nextjs-starter-webpack-monorepo my-monorepo-app
```

### 4. Middleware Setup
```bash
npx create-next-app@latest --example https://github.com/prisma/prisma-examples/tree/latest/generator-prisma-client/nextjs-starter-webpack-with-middleware my-middleware-app
```

### 5. Turborepo Setup
```bash
npx create-next-app@latest --example https://github.com/prisma/prisma-examples/tree/latest/generator-prisma-client/nextjs-starter-webpack-turborepo my-turborepo-app
```

## Authentication Integration

### 1. Clerk Integration Schema
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id      Int     @id @default(autoincrement())
  clerkId String  @unique
  email   String  @unique
  name    String?
  posts   Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

### 2. Better-Auth Models
```prisma
model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@map("account")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@map("verification")
}
```

### 3. Generate Better-Auth Models
```bash
npx @better-auth/cli generate
```

## Database Migration Examples

### 1. Generated Migration SQL
```sql
-- CreateTable
CREATE TABLE Tag (
    id SERIAL NOT NULL,
    name VARCHAR(255) NOT NULL,

    CONSTRAINT Tag_pkey PRIMARY KEY (id)
);

-- CreateTable
CREATE TABLE _PostToTag (
    A INTEGER NOT NULL,
    B INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX _PostToTag_AB_unique ON _PostToTag(A, B);

-- CreateIndex
CREATE INDEX _PostToTag_B_index ON _PostToTag(B);

-- AddForeignKey
ALTER TABLE _PostToTag ADD CONSTRAINT _PostToTag_A_fkey FOREIGN KEY (A) REFERENCES Post(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE _PostToTag ADD CONSTRAINT _PostToTag_B_fkey FOREIGN KEY (B) REFERENCES Tag(id) ON DELETE CASCADE ON UPDATE CASCADE;
```

## Schema Introspection Example

### 1. MySQL Schema After Introspection
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

## Advanced Generators

### 1. Yup Schema Generator
```typescript
import { generator } from '@prisma/generator-helper';

generator({
  // ... generator configuration
});

// Example usage of prisma-yup-generator:
// generator yup {
//   provider = "prisma-yup-generator"
// }
```

### 2. Class Validator Generator
```typescript
import { generator } from '@prisma/generator-helper';

generator({
  // ... generator configuration
});

// Example usage of prisma-class-validator-generator:
// generator classValidator {
//   provider = "prisma-class-validator-generator"
// }
```

### 3. Joi Schema Generator
```typescript
import { generator } from '@prisma/generator-helper';

generator({
  // ... generator configuration
});

// Example usage of prisma-joi-generator:
// generator joi {
//   provider = "prisma-joi-generator"
// }
```

### 4. TypeBox Schema Generator
```typescript
import { PrismaClient } from '@prisma/client';
import { createPrismabox } from 'prismabox';

const prisma = new PrismaClient();

const prismabox = createPrismabox(prisma);

const userSchema = prismabox.getUserSchema();

// Example usage with TypeBox:
// import { Type } from '@sinclair/typebox';
//
// const validatedUserData = Type.Strict(userSchema);
// const data = { id: 1, name: 'Test User', email: 'test@example.com' };
// const isValid = Type.Check(validatedUserData, data);
// console.log(isValid); // true
```

## Development Commands

### 1. Start Development Server
```bash
npm run dev
```

### 2. Start Development Server (pnpm)
```bash
pnpm run dev
```

### 3. Generate Client in Monorepo
```bash
npm run prisma:generate
```

## NestJS Integration

### 1. NestJS Prisma GraphQL Module
```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';
import { UserResolver } from './user.resolver';

@Module({
  imports: [PrismaModule],
  providers: [UserResolver],
})
export class UserModule {}
```

## GraphQL Integration

### 1. Nexus GraphQL Server Setup
```typescript
import {
  queryType,
  makeSchema
} from '@nexus/schema'
import { nexusSchemaPrisma } from 'nexus-plugin-prisma/schema'
import { GraphQLServer } from 'graphql-yoga'
import { createContext } from './context'

const Query = queryType({
  definition(t) {
    t.string('hello', () => {
      return 'Hello Nexus!'
    })
  },
})

export const schema = makeSchema({
  types: [Query],
  plugins: [nexusSchemaPrisma({ experimentalCRUD: true })],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  typegenAutoConfig: {
    contextType: 'Context.Context',
    sources: [
      {
        source: '@prisma/client',
        alias: 'prisma',
      },
      {
        source: require.resolve('./context'),
        alias: 'Context',
      },
    ],
  },
})

new GraphQLServer({ schema, context: createContext() }).start(() =>
  console.log(`Server ready at: http://localhost:4000`)
)
```

## Database Support

### Supported Databases (TypeScript Examples)
- **PostgreSQL**: `/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-postgresql`
- **MySQL**: `/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-mysql`
- **SQL Server**: `/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-sqlserver`
- **PlanetScale**: `/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-planetscale`
- **CockroachDB**: `/getting-started/setup-prisma/add-to-existing-project/relational-databases-typescript-cockroachdb`
- **MongoDB**: `/getting-started/setup-prisma/add-to-existing-project/mongodb-typescript-mongodb`

---

**Note**: This documentation is sourced directly from the official Prisma documentation via Context7, ensuring accuracy and up-to-date information for Prisma ORM integration with Next.js.