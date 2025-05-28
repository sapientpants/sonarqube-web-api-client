import { http, HttpResponse } from 'msw';
import { ProjectBadgesClient } from '../ProjectBadgesClient';
import { server } from '../../../test-utils/msw/server';
import { AuthenticationError, NotFoundError, RateLimitError, ServerError } from '../../../errors';
import { createApiError } from '../../../test-utils/msw/factories';

const SAMPLE_SVG_BADGE = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20">
  <rect width="100" height="20" fill="#4c1"/>
  <text x="50" y="14" fill="#fff" text-anchor="middle">passing</text>
</svg>
`.trim();

describe('ProjectBadgesClient', () => {
  let client: ProjectBadgesClient;
  const baseUrl = 'https://sonarqube.example.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new ProjectBadgesClient(baseUrl, token);
  });

  describe('aiCodeAssurance', () => {
    it('should return AI code assurance badge SVG', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/ai_code_assurance`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          expect(request.headers.get('accept')).toBe('image/svg+xml');
          expect(request.headers.get('authorization')).toBe(`Bearer ${token}`);

          return HttpResponse.text(SAMPLE_SVG_BADGE, {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.aiCodeAssurance({ project: 'my-project' });
      expect(result).toBe(SAMPLE_SVG_BADGE);
    });

    it('should include token parameter when provided', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/ai_code_assurance`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('token')).toBe('badge-token');

          return HttpResponse.text(SAMPLE_SVG_BADGE, {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.aiCodeAssurance({
        project: 'my-project',
        token: 'badge-token',
      });
      expect(result).toBe(SAMPLE_SVG_BADGE);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/ai_code_assurance`, () => {
          return HttpResponse.json(createApiError(401, 'Unauthorized'), {
            status: 401,
          });
        })
      );

      await expect(client.aiCodeAssurance({ project: 'my-project' })).rejects.toThrow(
        AuthenticationError
      );
    });

    it('should handle not found errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/ai_code_assurance`, () => {
          return HttpResponse.json(createApiError(404, 'Project not found'), {
            status: 404,
          });
        })
      );

      await expect(client.aiCodeAssurance({ project: 'non-existent' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('measure', () => {
    it('should return measure badge SVG', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/measure`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          expect(url.searchParams.get('metric')).toBe('coverage');
          expect(request.headers.get('accept')).toBe('image/svg+xml');

          return HttpResponse.text(SAMPLE_SVG_BADGE, {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.measure({
        project: 'my-project',
        metric: 'coverage',
      });
      expect(result).toBe(SAMPLE_SVG_BADGE);
    });

    it('should include optional parameters when provided', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/measure`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('branch')).toBe('develop');
          expect(url.searchParams.get('token')).toBe('badge-token');

          return HttpResponse.text(SAMPLE_SVG_BADGE, {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.measure({
        project: 'my-project',
        metric: 'bugs',
        branch: 'develop',
        token: 'badge-token',
      });
      expect(result).toBe(SAMPLE_SVG_BADGE);
    });

    it('should handle all metric types', async () => {
      const metrics = [
        'coverage',
        'ncloc',
        'code_smells',
        'sqale_rating',
        'security_rating',
        'bugs',
        'vulnerabilities',
        'duplicated_lines_density',
        'reliability_rating',
        'alert_status',
        'sqale_index',
      ] as const;

      for (const metric of metrics) {
        server.use(
          http.get(`${baseUrl}/api/project_badges/measure`, ({ request }) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('metric')).toBe(metric);

            return HttpResponse.text(SAMPLE_SVG_BADGE, {
              headers: { 'Content-Type': 'image/svg+xml' },
            });
          })
        );

        const result = await client.measure({
          project: 'my-project',
          metric,
        });
        expect(result).toBe(SAMPLE_SVG_BADGE);
      }
    });

    it('should handle rate limit errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/measure`, () => {
          return HttpResponse.json(createApiError(429, 'Rate limit exceeded'), {
            status: 429,
            headers: { 'Retry-After': '60' },
          });
        })
      );

      await expect(client.measure({ project: 'my-project', metric: 'coverage' })).rejects.toThrow(
        RateLimitError
      );
    });
  });

  describe('qualityGate', () => {
    it('should return quality gate badge SVG', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/quality_gate`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe('my-project');
          expect(request.headers.get('accept')).toBe('image/svg+xml');

          return HttpResponse.text(SAMPLE_SVG_BADGE, {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.qualityGate({ project: 'my-project' });
      expect(result).toBe(SAMPLE_SVG_BADGE);
    });

    it('should include optional parameters when provided', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/quality_gate`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('branch')).toBe('main');
          expect(url.searchParams.get('token')).toBe('badge-token');

          return HttpResponse.text(SAMPLE_SVG_BADGE, {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.qualityGate({
        project: 'my-project',
        branch: 'main',
        token: 'badge-token',
      });
      expect(result).toBe(SAMPLE_SVG_BADGE);
    });

    it('should handle server errors', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/quality_gate`, () => {
          return HttpResponse.json(createApiError(500, 'Internal Server Error'), {
            status: 500,
          });
        })
      );

      await expect(client.qualityGate({ project: 'my-project' })).rejects.toThrow(ServerError);
    });
  });

  describe('edge cases', () => {
    it('should handle empty SVG responses', async () => {
      server.use(
        http.get(`${baseUrl}/api/project_badges/quality_gate`, () => {
          return HttpResponse.text('', {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.qualityGate({ project: 'my-project' });
      expect(result).toBe('');
    });

    it('should preserve special characters in project names', async () => {
      const projectName = 'my-project/with:special@chars';

      server.use(
        http.get(`${baseUrl}/api/project_badges/quality_gate`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('project')).toBe(projectName);

          return HttpResponse.text(SAMPLE_SVG_BADGE, {
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        })
      );

      const result = await client.qualityGate({ project: projectName });
      expect(result).toBe(SAMPLE_SVG_BADGE);
    });
  });
});
