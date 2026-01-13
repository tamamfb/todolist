import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'; // ✅ IMPORT INI
import { join } from 'path'; // ✅ IMPORT INI

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // ✅ SERVE STATIC FILES from uploads directory at /uploads/ prefix
  // When running from project root, uploads folder is at ./server/uploads or ./uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  console.log("Serving static files from:", uploadsPath);
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();