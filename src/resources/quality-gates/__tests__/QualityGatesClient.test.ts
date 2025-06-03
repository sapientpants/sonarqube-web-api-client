import { QualityGatesClient } from '../QualityGatesClient';
import { http } from 'msw';
import { server } from '../../../test-utils';

describe('QualityGatesClient', () => {
  let client: QualityGatesClient;

  beforeEach(() => {
    client = new QualityGatesClient('http://localhost', 'token');
  });

  describe('get', () => {
    it('should fetch a quality gate by ID', async () => {
      const mockResponse = {
        id: '1',
        name: 'Sonar way',
        conditions: [{ id: '1', metric: 'coverage', op: 'LT', error: '80' }],
        isDefault: true,
        isBuiltIn: true,
      };

      server.use(
        http.get('http://localhost/api/qualitygates/show', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('id')).toBe('1');
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.get({ id: '1' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching quality gate', async () => {
      server.use(
        http.get('http://localhost/api/qualitygates/show', () => {
          return new Response(JSON.stringify({ errors: [{ msg: 'Quality gate not found' }] }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await expect(client.get({ id: 'non-existent' })).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list all quality gates', async () => {
      const mockResponse = {
        qualitygates: [
          { id: '1', name: 'Sonar way', isDefault: true, isBuiltIn: true },
          { id: '2', name: 'Custom Gate', isDefault: false, isBuiltIn: false },
        ],
        default: '1',
      };

      server.use(
        http.get('http://localhost/api/qualitygates/list', () => {
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.list();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('should create a quality gate', async () => {
      const mockResponse = {
        id: '3',
        name: 'New Gate',
      };

      server.use(
        http.post('http://localhost/api/qualitygates/create', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ name: 'New Gate' });
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.create({ name: 'New Gate' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rename', () => {
    it('should rename a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/rename', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ id: '3', name: 'Updated Gate' });
          return new Response(null, { status: 204 });
        })
      );

      await client.rename({ id: '3', name: 'Updated Gate' });
    });
  });

  describe('delete', () => {
    it('should delete a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/destroy', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ id: '3' });
          return new Response(null, { status: 204 });
        })
      );

      await client.delete({ id: '3' });
    });
  });

  describe('setAsDefault', () => {
    it('should set a quality gate as default', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/set_as_default', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ id: '2' });
          return new Response(null, { status: 204 });
        })
      );

      await client.setAsDefault({ id: '2' });
    });
  });

  describe('copy', () => {
    it('should copy a quality gate', async () => {
      const mockResponse = {
        id: '4',
        name: 'Copy of Sonar way',
      };

      server.use(
        http.post('http://localhost/api/qualitygates/copy', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ id: '1', name: 'Copy of Sonar way' });
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.copy({ id: '1', name: 'Copy of Sonar way' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rename', () => {
    it('should rename a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/rename', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ id: '2', name: 'Renamed Gate' });
          return new Response(null, { status: 204 });
        })
      );

      await client.rename({ id: '2', name: 'Renamed Gate' });
    });
  });

  describe('setCondition', () => {
    it('should add a condition to a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/create_condition', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            gateId: '1',
            metric: 'coverage',
            op: 'LT',
            error: '80',
          });
          return new Response(null, { status: 204 });
        })
      );

      await client.setCondition({
        gateId: '1',
        metric: 'coverage',
        operator: 'LT',
        error: '80',
      });
    });
  });

  describe('updateCondition', () => {
    it('should update a condition on a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/update_condition', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            id: '1',
            metric: 'coverage',
            op: 'LT',
            error: '90',
          });
          return new Response(null, { status: 204 });
        })
      );

      await client.updateCondition({
        id: '1',
        metric: 'coverage',
        operator: 'LT',
        error: '90',
      });
    });
  });

  describe('deleteCondition', () => {
    it('should delete a condition from a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/delete_condition', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({ id: '1' });
          return new Response(null, { status: 204 });
        })
      );

      await client.deleteCondition({ id: '1' });
    });
  });

  describe('getProjects', () => {
    it('should get projects associated with a quality gate', async () => {
      const mockResponse = {
        results: [
          { id: '1', key: 'project1', name: 'Project 1', selected: true },
          { id: '2', key: 'project2', name: 'Project 2', selected: false },
        ],
        paging: { pageIndex: 1, pageSize: 100, total: 2 },
      };

      server.use(
        http.get('http://localhost/api/qualitygates/search', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('gateId')).toBe('1');
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.getProjects({ gateId: '1' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle pagination and query parameters', async () => {
      server.use(
        http.get('http://localhost/api/qualitygates/search', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('gateId')).toBe('1');
          expect(url.searchParams.get('p')).toBe('2');
          expect(url.searchParams.get('ps')).toBe('50');
          expect(url.searchParams.get('query')).toBe('test');
          expect(url.searchParams.get('selected')).toBe('selected');
          return new Response(JSON.stringify({ results: [], paging: {} }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await client.getProjects({
        gateId: '1',
        p: 2,
        ps: 50,
        query: 'test',
        selected: 'selected',
      });
    });
  });

  describe('associateProjects', () => {
    it('should associate projects with a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/select', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            gateId: '1',
            projectKey: 'project1,project2',
          });
          return new Response(null, { status: 204 });
        })
      );

      await client.associateProjects({
        gateId: '1',
        projectKeys: ['project1', 'project2'],
      });
    });
  });

  describe('dissociateProjects', () => {
    it('should dissociate projects from a quality gate', async () => {
      server.use(
        http.post('http://localhost/api/qualitygates/deselect', async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            gateId: '1',
            projectKey: 'project1,project2',
          });
          return new Response(null, { status: 204 });
        })
      );

      await client.dissociateProjects({
        gateId: '1',
        projectKeys: ['project1', 'project2'],
      });
    });
  });

  describe('getProjectStatus', () => {
    it('should get quality gate status for a project by key', async () => {
      const mockResponse = {
        projectStatus: {
          status: 'OK',
          conditions: [
            {
              status: 'OK',
              metricKey: 'coverage',
              comparator: 'LT',
              errorThreshold: '80',
              actualValue: '85',
            },
          ],
        },
      };

      server.use(
        http.get('http://localhost/api/qualitygates/project_status', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('projectKey')).toBe('my-project');
          return new Response(JSON.stringify(mockResponse), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await client.getProjectStatus({ projectKey: 'my-project' });
      expect(result).toEqual(mockResponse);
    });

    it('should handle all parameters for project status', async () => {
      server.use(
        http.get('http://localhost/api/qualitygates/project_status', ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('projectId')).toBe('AVXuGHKutxRmSBZ3KuSQ');
          expect(url.searchParams.get('analysisId')).toBe('AXNDXm6h');
          expect(url.searchParams.get('branch')).toBe('feature/test');
          expect(url.searchParams.get('pullRequest')).toBe('42');
          return new Response(JSON.stringify({ projectStatus: {} }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      await client.getProjectStatus({
        projectId: 'AVXuGHKutxRmSBZ3KuSQ',
        analysisId: 'AXNDXm6h',
        branch: 'feature/test',
        pullRequest: '42',
      });
    });
  });

  describe('builder methods', () => {
    it('should create a SetConditionBuilder', () => {
      const builder = client.setConditionBuilder('1');
      expect(builder).toBeDefined();
      expect(builder['params'].gateId).toBe('1');
    });

    it('should create a GetProjectsBuilder', () => {
      const builder = client.getProjectsBuilder('1');
      expect(builder).toBeDefined();
      expect(builder['params'].gateId).toBe('1');
    });

    it('should create an AssociateProjectsBuilder', () => {
      const builder = client.associateProjectsBuilder('1');
      expect(builder).toBeDefined();
      expect(builder['params'].gateId).toBe('1');
    });
  });
});
