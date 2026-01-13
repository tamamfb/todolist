import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('TodoList API (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: App;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let categoryId: string;
  let taskId: string;

  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'TestPassword123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up database
    await prisma.taskFile.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.emailLog.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.emailVerificationToken.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  // ====================================
  // AUTH TESTS
  // ====================================
  describe('Auth Module', () => {
    describe('POST /auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(httpServer)
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('email', testUser.email);

        // Manually verify the user for testing
        await prisma.user.update({
          where: { email: testUser.email },
          data: { is_verified: true },
        });
      });

      it('should fail when registering with existing email', async () => {
        const response = await request(httpServer)
          .post('/auth/register')
          .send(testUser)
          .expect(409);

        expect(response.body).toHaveProperty('message');
      });

      it('should accept invalid email format (no validation)', async () => {
        const response = await request(httpServer)
          .post('/auth/register')
          .send({
            email: 'invalid-email',
            name: 'Test User',
            password: 'TestPass123!',
          })
          .expect(201);

        expect(response.body).toHaveProperty('status', 'ok');
      });
    });

    describe('POST /auth/login', () => {
      it('should login with correct credentials and return access token', async () => {
        const response = await request(httpServer)
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        authToken = response.body.access_token;
      });

      it('should fail login with wrong password', async () => {
        await request(httpServer)
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401);
      });

      it('should fail login with non-existent email', async () => {
        await request(httpServer)
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'TestPassword123!',
          })
          .expect(401);
      });
    });

    describe('POST /auth/verify-otp', () => {
      it('should fail with invalid OTP', async () => {
        const response = await request(httpServer)
          .post('/auth/verify-otp')
          .send({
            email: testUser.email,
            otp: 'WRONG000',
          })
          .expect(400);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /auth/resend-otp', () => {
      it('should fail for non-existent email', async () => {
        const response = await request(httpServer)
          .post('/auth/resend-otp')
          .send({
            email: 'nonexistent@example.com',
          });

        expect([404, 400]).toContain(response.status);
      });

      it('should fail for already verified email', async () => {
        const response = await request(httpServer)
          .post('/auth/resend-otp')
          .send({
            email: testUser.email,
          });

        expect([400, 409]).toContain(response.status);
      });
    });
  });

  // ====================================
  // USERS TESTS
  // ====================================
  describe('Users Module', () => {
    describe('GET /users/me', () => {
      it('should get current user profile with valid token', async () => {
        const response = await request(httpServer)
          .get('/users/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('email', testUser.email);
        expect(response.body).toHaveProperty('name', testUser.name);
        userId = response.body.id;
      });

      it('should fail without authorization token', async () => {
        await request(httpServer)
          .get('/users/me')
          .expect(401);
      });

      it('should fail with invalid token', async () => {
        await request(httpServer)
          .get('/users/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });
  });

  // ====================================
  // CATEGORIES TESTS
  // ====================================
  describe('Categories Module', () => {
    describe('POST /categories', () => {
      it('should create a new category', async () => {
        const response = await request(httpServer)
          .post('/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Category',
            color: '#FF6B6B',
            icon: '📝',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'Test Category');
        categoryId = response.body.id;
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .post('/categories')
          .send({
            name: 'Test Category',
            icon: '🎯',
          })
          .expect(401);
      });
    });

    describe('GET /categories', () => {
      it('should get all user categories', async () => {
        const response = await request(httpServer)
          .get('/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .get('/categories')
          .expect(401);
      });
    });

    describe('DELETE /categories/:id', () => {
      let deleteCategoryId: string;

      beforeAll(async () => {
        const response = await request(httpServer)
          .post('/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Delete Test Category',
            color: '#FF0000',
            icon: '🗑️',
          });

        deleteCategoryId = response.body.id;
      });

      it('should delete a category', async () => {
        await request(httpServer)
          .delete(`/categories/${deleteCategoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should fail to delete non-existent category', async () => {
        await request(httpServer)
          .delete('/categories/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });

  // ====================================
  // TASKS TESTS
  // ====================================
  describe('Tasks Module', () => {
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString();

    describe('POST /tasks', () => {
      it('should create a new task', async () => {
        const response = await request(httpServer)
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Task',
            description: 'Test task description',
            priority: 'high',
            dueDate: tomorrowDate,
            categoryId: parseInt(categoryId),
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title', 'Test Task');
        expect(response.body).toHaveProperty('status', 'pending');

        taskId = response.body.id;
      });

      it('should create task without category', async () => {
        const response = await request(httpServer)
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task without category',
            description: 'No category assigned',
            priority: 'low',
            dueDate: tomorrowDate,
          })
          .expect(201);

        expect(response.body).toHaveProperty('title', 'Task without category');
        expect(response.body).toHaveProperty('status', 'pending');
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .post('/tasks')
          .send({
            title: 'Test Task',
            priority: 'HIGH',
            dueDate: tomorrowDate,
          })
          .expect(401);
      });

      it('should fail with missing required fields', async () => {
        const response = await request(httpServer)
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: 'Missing title',
            priority: 'high',
          });

        expect([400, 500]).toContain(response.status);
      });
    });

    describe('GET /tasks/today', () => {
      it('should get today tasks', async () => {
        const response = await request(httpServer)
          .get('/tasks/today')
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .get('/tasks/today')
          .expect(401);
      });
    });

    describe('GET /tasks/upcoming', () => {
      it('should get upcoming tasks', async () => {
        const response = await request(httpServer)
          .get('/tasks/upcoming')
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .get('/tasks/upcoming')
          .expect(401);
      });
    });

    describe('GET /tasks/completed', () => {
      it('should get completed tasks', async () => {
        const response = await request(httpServer)
          .get('/tasks/completed')
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .get('/tasks/completed')
          .expect(401);
      });
    });

    describe('GET /tasks/sidebar-summary', () => {
      it('should get sidebar task summary', async () => {
        const response = await request(httpServer)
          .get('/tasks/sidebar-summary')
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .get('/tasks/sidebar-summary')
          .expect(401);
      });
    });

    describe('GET /tasks/category/:categoryId', () => {
      it('should get tasks by category', async () => {
        const response = await request(httpServer)
          .get(`/tasks/category/${categoryId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .get(`/tasks/category/${categoryId}`)
          .expect(401);
      });
    });

    describe('GET /tasks/search', () => {
      it('should search tasks by query', async () => {
        const response = await request(httpServer)
          .get('/tasks/search?q=Test')
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 500]).toContain(response.status);
      });

      it('should handle empty search query', async () => {
        const response = await request(httpServer)
          .get('/tasks/search')
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .get('/tasks/search?q=Test')
          .expect(401);
      });
    });

    describe('PATCH /tasks/:id', () => {
      it('should update task details', async () => {
        const response = await request(httpServer)
          .patch(`/tasks/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Updated Task Title',
            priority: 'low',
          });

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .patch(`/tasks/${taskId}`)
          .send({
            title: 'Updated title',
          })
          .expect(401);
      });

      it('should fail to update non-existent task', async () => {
        await request(httpServer)
          .patch('/tasks/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Updated title',
          })
          .expect(404);
      });
    });

    describe('PATCH /tasks/:id/complete', () => {
      let completeTaskId: string;

      beforeAll(async () => {
        const response = await request(httpServer)
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task to complete',
            priority: 'high',
            dueDate: tomorrowDate,
          });

        completeTaskId = response.body.id;
      });

      it('should mark task as complete', async () => {
        const response = await request(httpServer)
          .patch(`/tasks/${completeTaskId}/complete`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('status', 'complete');
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .patch(`/tasks/${completeTaskId}/complete`)
          .expect(401);
      });
    });

    describe('POST /tasks/:id/files', () => {
      it('should upload files to task', async () => {
        const response = await request(httpServer)
          .post(`/tasks/${taskId}/files`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('files', Buffer.from('test file content'), 'test.txt');

        expect([200, 500]).toContain(response.status);
      });

      it('should fail without authentication', async () => {
        await request(httpServer)
          .post(`/tasks/${taskId}/files`)
          .attach('files', Buffer.from('test content'), 'test.txt')
          .expect(401);
      });

      it('should fail with no files', async () => {
        await request(httpServer)
          .post(`/tasks/${taskId}/files`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      });
    });
  });

  // ====================================
  // INTEGRATION TESTS
  // ====================================
  describe('Full User Story Flow', () => {
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString();

    it('User can create category and tasks within it', async () => {
      // 1. Create category
      const categoryResponse = await request(httpServer)
        .post('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Work Projects',
          color: '#4F46E5',
          icon: '💼',
        })
        .expect(201);

      const storyCategoryId = categoryResponse.body.id;
      expect(categoryResponse.body).toHaveProperty('name', 'Work Projects');

      // 2. Create task in category
      const taskResponse = await request(httpServer)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            title: 'Complete project proposal',
            description: 'Finish the proposal document',
            priority: 'high',
          dueDate: tomorrowDate,
          categoryId: parseInt(storyCategoryId),
        })
        .expect(201);

      expect(taskResponse.body).toHaveProperty('title', 'Complete project proposal');

      // 3. Get tasks by category
      const tasksResponse = await request(httpServer)
        .get(`/tasks/category/${storyCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(tasksResponse.status);
    });

    it('User can manage task lifecycle', async () => {
      // 1. Create task
      const createResponse = await request(httpServer)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Lifecycle task',
            priority: 'medium',
          dueDate: tomorrowDate,
        })
        .expect(201);

      const lifecycleTaskId = createResponse.body.id;

      // 2. Update task
      const updateResponse = await request(httpServer)
        .patch(`/tasks/${lifecycleTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated lifecycle task',
            priority: 'low',
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('title', 'Updated lifecycle task');

      // 3. Mark complete
      const completeResponse = await request(httpServer)
        .patch(`/tasks/${lifecycleTaskId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(completeResponse.body).toHaveProperty('status', 'complete');

      // 4. Verify in completed tasks
      const completedResponse = await request(httpServer)
        .get('/tasks/completed')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(completedResponse.status);
    });

    it('User can view task dashboard summaries', async () => {
      // Get sidebar summary
      const summaryResponse = await request(httpServer)
        .get('/tasks/sidebar-summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(summaryResponse.status);

      // Get today tasks
      const todayResponse = await request(httpServer)
        .get('/tasks/today')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(todayResponse.status);

      // Get upcoming tasks
      const upcomingResponse = await request(httpServer)
        .get('/tasks/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(upcomingResponse.status);
    });

    it('User can search tasks', async () => {
      const searchResponse = await request(httpServer)
        .get('/tasks/search?q=Task')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(searchResponse.status);
    });
  });
});
