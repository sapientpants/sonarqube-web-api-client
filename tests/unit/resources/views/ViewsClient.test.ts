// @ts-nocheck
import { http, HttpResponse } from 'msw';
import { server } from '../../../../src/test-utils/msw/server.js';
import { ViewsClient } from '../../../../src/resources/views/ViewsClient.js';
import type { ShowPortfolioResponse } from '../../../../src/resources/views/types.js';
import {
  AuthenticationError,
  AuthorizationError,
  NetworkError,
} from '../../../../src/errors/index.js';

describe('ViewsClient', () => {
  let client: ViewsClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new ViewsClient(baseUrl, token);
  });

  describe('addApplication', () => {
    const application = 'my-app-key';
    const portfolio = 'my-portfolio-key';

    it('should add application to portfolio successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe(`application=${application}&portfolio=${portfolio}`);

          const contentType = request.headers.get('content-type');
          expect(contentType).toBe('application/x-www-form-urlencoded');

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.addApplication({
          application,
          portfolio,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle application key with special characters', async () => {
      const specialApp = 'app-key-with-special-chars-!@#$%^&*()';

      server.use(
        http.post(`${baseUrl}/api/views/add_application`, async ({ request }) => {
          const body = await request.text();
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('application', specialApp);
          expectedFormData.append('portfolio', portfolio);
          expect(body).toBe(expectedFormData.toString());

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.addApplication({
          application: specialApp,
          portfolio,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        }),
      );

      await expect(client.addApplication({ application, portfolio })).rejects.toThrow(
        AuthenticationError,
      );
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        }),
      );

      await expect(client.addApplication({ application, portfolio })).rejects.toThrow(
        AuthorizationError,
      );
    });

    it('should handle portfolio not found errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application`, () => {
          return new HttpResponse('Portfolio not found', { status: 404 });
        }),
      );

      await expect(client.addApplication({ application, portfolio })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.addApplication({ application, portfolio })).rejects.toThrow(NetworkError);
    });
  });

  describe('addApplicationBranch', () => {
    const application = 'my-app-key';
    const branch = 'feature-branch';
    const portfolio = 'my-portfolio-key';

    it('should add application branch to portfolio successfully', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application_branch`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe(`application=${application}&branch=${branch}&portfolio=${portfolio}`);

          const contentType = request.headers.get('content-type');
          expect(contentType).toBe('application/x-www-form-urlencoded');

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.addApplicationBranch({
          application,
          branch,
          portfolio,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle branch name with special characters', async () => {
      const specialBranch = 'feature/branch-with-special-chars-!@#$%^&*()';

      server.use(
        http.post(`${baseUrl}/api/views/add_application_branch`, async ({ request }) => {
          const body = await request.text();
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('application', application);
          expectedFormData.append('branch', specialBranch);
          expectedFormData.append('portfolio', portfolio);
          expect(body).toBe(expectedFormData.toString());

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(
        client.addApplicationBranch({
          application,
          branch: specialBranch,
          portfolio,
        }),
      ).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application_branch`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        }),
      );

      await expect(client.addApplicationBranch({ application, branch, portfolio })).rejects.toThrow(
        AuthenticationError,
      );
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application_branch`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        }),
      );

      await expect(client.addApplicationBranch({ application, branch, portfolio })).rejects.toThrow(
        AuthorizationError,
      );
    });

    it('should handle branch not found errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/add_application_branch`, () => {
          return new HttpResponse('Branch not found', { status: 404 });
        }),
      );

      await expect(
        client.addApplicationBranch({ application, branch, portfolio }),
      ).rejects.toThrow();
    });
  });

  describe('show', () => {
    const portfolioKey = 'my-portfolio-key';
    const mockPortfolioResponse: ShowPortfolioResponse = {
      key: portfolioKey,
      name: 'My Portfolio',
      description: 'Portfolio description',
      qualifier: 'VW',
      visibility: 'public',
      components: [
        {
          key: 'app-1',
          name: 'Application 1',
          qualifier: 'APP',
          description: 'First application',
        },
        {
          key: 'project-1',
          name: 'Project 1',
          qualifier: 'TRK',
        },
      ],
      subPortfolios: [
        {
          key: 'sub-portfolio-1',
          name: 'Sub Portfolio 1',
          qualifier: 'VW',
        },
      ],
    };

    it('should show portfolio details successfully', async () => {
      server.use(
        http.get(`${baseUrl}/api/views/show`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe(portfolioKey);

          return HttpResponse.json(mockPortfolioResponse);
        }),
      );

      const result = await client.show({ key: portfolioKey });

      expect(result).toEqual(mockPortfolioResponse);
      expect(result.components).toHaveLength(2);
      expect(result.subPortfolios).toHaveLength(1);
    });

    it('should handle portfolio key with special characters', async () => {
      const specialKey = 'portfolio-key-with-special-chars-!@#$%^&*()';

      server.use(
        http.get(`${baseUrl}/api/views/show`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('key')).toBe(specialKey);

          return HttpResponse.json({ ...mockPortfolioResponse, key: specialKey });
        }),
      );

      const result = await client.show({ key: specialKey });
      expect(result.key).toBe(specialKey);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/views/show`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        }),
      );

      await expect(client.show({ key: portfolioKey })).rejects.toThrow(AuthenticationError);
    });

    it('should handle portfolio not found errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/views/show`, () => {
          return new HttpResponse('Portfolio not found', { status: 404 });
        }),
      );

      await expect(client.show({ key: portfolioKey })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/views/show`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.show({ key: portfolioKey })).rejects.toThrow(NetworkError);
    });
  });

  describe('update', () => {
    const portfolioKey = 'my-portfolio-key';

    it('should update portfolio successfully with all fields', async () => {
      const updateData = {
        key: portfolioKey,
        name: 'Updated Portfolio Name',
        description: 'Updated portfolio description',
      };

      server.use(
        http.post(`${baseUrl}/api/views/update`, async ({ request }) => {
          const body = await request.text();
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('key', portfolioKey);
          expectedFormData.append('name', updateData.name);
          expectedFormData.append('description', updateData.description);
          expect(body).toBe(expectedFormData.toString());

          const contentType = request.headers.get('content-type');
          expect(contentType).toBe('application/x-www-form-urlencoded');

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(client.update(updateData)).resolves.toBeUndefined();
    });

    it('should update portfolio with only name', async () => {
      const updateData = {
        key: portfolioKey,
        name: 'Updated Name Only',
      };

      server.use(
        http.post(`${baseUrl}/api/views/update`, async ({ request }) => {
          const body = await request.text();
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('key', portfolioKey);
          expectedFormData.append('name', updateData.name);
          expect(body).toBe(expectedFormData.toString());

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(client.update(updateData)).resolves.toBeUndefined();
    });

    it('should update portfolio with only description', async () => {
      const updateData = {
        key: portfolioKey,
        description: 'Updated description only',
      };

      server.use(
        http.post(`${baseUrl}/api/views/update`, async ({ request }) => {
          const body = await request.text();
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('key', portfolioKey);
          expectedFormData.append('description', updateData.description);
          expect(body).toBe(expectedFormData.toString());

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(client.update(updateData)).resolves.toBeUndefined();
    });

    it('should update portfolio with only key (no changes)', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/update`, async ({ request }) => {
          const body = await request.text();
          expect(body).toBe(`key=${portfolioKey}`);

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(client.update({ key: portfolioKey })).resolves.toBeUndefined();
    });

    it('should handle special characters in update fields', async () => {
      const updateData = {
        key: portfolioKey,
        name: 'Portfolio with special chars: !@#$%^&*()',
        description: 'Description with special chars: <>&"\'',
      };

      server.use(
        http.post(`${baseUrl}/api/views/update`, async ({ request }) => {
          const body = await request.text();
          const expectedFormData = new URLSearchParams();
          expectedFormData.append('key', portfolioKey);
          expectedFormData.append('name', updateData.name);
          expectedFormData.append('description', updateData.description);
          expect(body).toBe(expectedFormData.toString());

          return new HttpResponse('', { status: 204 });
        }),
      );

      await expect(client.update(updateData)).resolves.toBeUndefined();
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/update`, () => {
          return new HttpResponse('Unauthorized', { status: 401 });
        }),
      );

      await expect(client.update({ key: portfolioKey })).rejects.toThrow(AuthenticationError);
    });

    it('should handle authorization errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/update`, () => {
          return new HttpResponse('Insufficient privileges', { status: 403 });
        }),
      );

      await expect(client.update({ key: portfolioKey })).rejects.toThrow(AuthorizationError);
    });

    it('should handle portfolio not found errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/update`, () => {
          return new HttpResponse('Portfolio not found', { status: 404 });
        }),
      );

      await expect(client.update({ key: portfolioKey })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/update`, () => {
          return HttpResponse.error();
        }),
      );

      await expect(client.update({ key: portfolioKey })).rejects.toThrow(NetworkError);
    });
  });

  describe('client initialization', () => {
    it('should create client with organization parameter', () => {
      const clientWithOrg = new ViewsClient(baseUrl, 'test-token', 'my-org');
      expect(clientWithOrg).toBeInstanceOf(ViewsClient);
    });

    it('should create client without organization parameter', () => {
      const clientWithoutOrg = new ViewsClient(baseUrl, 'test-token');
      expect(clientWithoutOrg).toBeInstanceOf(ViewsClient);
    });

    it('should create client with options object', () => {
      const clientWithOptions = new ViewsClient(baseUrl, 'test-token', {
        organization: 'my-org',
        timeout: 10000,
      });
      expect(clientWithOptions).toBeInstanceOf(ViewsClient);
    });
  });

  describe('authorization header', () => {
    it('should include authorization header when token is provided', async () => {
      server.use(
        http.post(`${baseUrl}/api/views/update`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          expect(authHeader).toBe('Bearer test-token');
          return new HttpResponse('', { status: 204 });
        }),
      );

      await client.update({ key: 'test-portfolio' });
    });

    it('should work without authorization header when token is empty', async () => {
      const clientWithoutToken = new ViewsClient(baseUrl, '');

      server.use(
        http.post(`${baseUrl}/api/views/update`, ({ request }) => {
          const authHeader = request.headers.get('authorization');
          expect(authHeader).toBeNull();
          return new HttpResponse('', { status: 204 });
        }),
      );

      await clientWithoutToken.update({ key: 'test-portfolio' });
    });
  });
});
