import { SetConditionBuilder, GetProjectsBuilder, AssociateProjectsBuilder } from '../builders';
import type { QualityGateProject as Project } from '../types';

describe('Quality Gates Builders', () => {
  describe('SetConditionBuilder', () => {
    let executor: jest.Mock;
    let builder: SetConditionBuilder;

    beforeEach(() => {
      executor = jest.fn();
      builder = new SetConditionBuilder(executor, 'gate-123');
    });

    describe('fluent interface', () => {
      it('should set metric', () => {
        builder.withMetric('coverage');
        expect(builder['params'].metric).toBe('coverage');
      });

      it('should set operator', () => {
        builder.withOperator('LT');
        expect(builder['params'].operator).toBe('LT');
      });

      it('should set error threshold', () => {
        builder.withErrorThreshold('80');
        expect(builder['params'].error).toBe('80');
      });

      it('should set warning threshold', () => {
        builder.withWarningThreshold('70');
        expect(builder['params'].warning).toBe('70');
      });

      it('should use coverage metric shorthand', () => {
        builder.forCoverage();
        expect(builder['params'].metric).toBe('coverage');
      });

      it('should use duplicated lines density metric shorthand', () => {
        builder.forDuplicatedLinesDensity();
        expect(builder['params'].metric).toBe('duplicated_lines_density');
      });

      it('should use maintainability rating metric shorthand', () => {
        builder.forMaintainabilityRating();
        expect(builder['params'].metric).toBe('sqale_rating');
      });

      it('should use reliability rating metric shorthand', () => {
        builder.forReliabilityRating();
        expect(builder['params'].metric).toBe('reliability_rating');
      });

      it('should use security rating metric shorthand', () => {
        builder.forSecurityRating();
        expect(builder['params'].metric).toBe('security_rating');
      });

      it('should use security hotspots reviewed metric shorthand', () => {
        builder.forSecurityHotspotsReviewed();
        expect(builder['params'].metric).toBe('security_hotspots_reviewed');
      });

      it('should use less than operator shorthand', () => {
        builder.lessThan();
        expect(builder['params'].operator).toBe('LT');
      });

      it('should use greater than operator shorthand', () => {
        builder.greaterThan();
        expect(builder['params'].operator).toBe('GT');
      });

      it('should use equals operator shorthand', () => {
        builder.equals();
        expect(builder['params'].operator).toBe('EQ');
      });

      it('should use not equals operator shorthand', () => {
        builder.notEquals();
        expect(builder['params'].operator).toBe('NE');
      });

      it('should support method chaining', () => {
        const result = builder
          .forCoverage()
          .lessThan()
          .withErrorThreshold('80')
          .withWarningThreshold('70');

        expect(result).toBe(builder);
        expect(builder['params']).toMatchObject({
          gateId: 'gate-123',
          metric: 'coverage',
          operator: 'LT',
          error: '80',
          warning: '70',
        });
      });
    });

    describe('execute', () => {
      it('should execute with valid parameters', async () => {
        await builder.withMetric('coverage').withOperator('LT').withErrorThreshold('80').execute();

        expect(executor).toHaveBeenCalledWith({
          gateId: 'gate-123',
          metric: 'coverage',
          operator: 'LT',
          error: '80',
        });
      });

      it('should execute with only warning threshold', async () => {
        await builder.withMetric('bugs').withOperator('GT').withWarningThreshold('5').execute();

        expect(executor).toHaveBeenCalledWith({
          gateId: 'gate-123',
          metric: 'bugs',
          operator: 'GT',
          warning: '5',
        });
      });

      it('should execute with both thresholds', async () => {
        await builder
          .forCoverage()
          .lessThan()
          .withErrorThreshold('80')
          .withWarningThreshold('90')
          .execute();

        expect(executor).toHaveBeenCalledWith({
          gateId: 'gate-123',
          metric: 'coverage',
          operator: 'LT',
          error: '80',
          warning: '90',
        });
      });

      it('should throw error when metric is missing', async () => {
        await expect(builder.withOperator('LT').withErrorThreshold('80').execute()).rejects.toThrow(
          'Metric is required'
        );
      });

      it('should throw error when operator is missing', async () => {
        await expect(
          builder.withMetric('coverage').withErrorThreshold('80').execute()
        ).rejects.toThrow('Operator is required');
      });

      it('should throw error when no threshold is specified', async () => {
        await expect(builder.withMetric('coverage').withOperator('LT').execute()).rejects.toThrow(
          'At least one threshold (error or warning) must be specified'
        );
      });

      it('should throw error when thresholds are empty strings', async () => {
        await expect(
          builder
            .withMetric('coverage')
            .withOperator('LT')
            .withErrorThreshold('')
            .withWarningThreshold('')
            .execute()
        ).rejects.toThrow('At least one threshold (error or warning) must be specified');
      });
    });
  });

  describe('GetProjectsBuilder', () => {
    let executor: jest.Mock;
    let builder: GetProjectsBuilder;

    beforeEach(() => {
      executor = jest.fn();
      builder = new GetProjectsBuilder(executor, 'gate-123');
    });

    describe('fluent interface', () => {
      it('should set query', () => {
        builder.withQuery('test');
        expect(builder['params'].query).toBe('test');
      });

      it('should set selection filter', () => {
        builder.withSelection('selected');
        expect(builder['params'].selected).toBe('selected');
      });

      it('should use onlySelected shorthand', () => {
        builder.onlySelected();
        expect(builder['params'].selected).toBe('selected');
      });

      it('should use onlyDeselected shorthand', () => {
        builder.onlyDeselected();
        expect(builder['params'].selected).toBe('deselected');
      });

      it('should use showAll shorthand', () => {
        builder.showAll();
        expect(builder['params'].selected).toBe('all');
      });

      it('should support method chaining', () => {
        const result = builder.withQuery('test').onlySelected().pageSize(50).page(2);

        expect(result).toBe(builder);
        expect(builder['params']).toMatchObject({
          gateId: 'gate-123',
          query: 'test',
          selected: 'selected',
          ps: 50,
          p: 2,
        });
      });
    });

    describe('execute', () => {
      it('should execute with minimal parameters', async () => {
        const mockResponse = {
          results: [],
          paging: { pageIndex: 1, pageSize: 100, total: 0 },
        };
        executor.mockResolvedValue(mockResponse);

        const result = await builder.execute();
        expect(result).toEqual(mockResponse);
        expect(executor).toHaveBeenCalledWith({
          gateId: 'gate-123',
        });
      });

      it('should execute with all parameters', async () => {
        const mockResponse = {
          results: [{ id: '1', key: 'project1', name: 'Project 1', selected: true }],
          paging: { pageIndex: 1, pageSize: 50, total: 1 },
        };
        executor.mockResolvedValue(mockResponse);

        const result = await builder.withQuery('project').onlySelected().pageSize(50).execute();

        expect(result).toEqual(mockResponse);
        expect(executor).toHaveBeenCalledWith({
          gateId: 'gate-123',
          query: 'project',
          selected: 'selected',
          ps: 50,
        });
      });
    });

    describe('pagination', () => {
      it('should extract items from response', () => {
        const response = {
          results: [
            { id: '1', key: 'project1', name: 'Project 1', selected: true },
            { id: '2', key: 'project2', name: 'Project 2', selected: false },
          ],
          paging: { pageIndex: 1, pageSize: 100, total: 2 },
        };

        const items = builder['getItems'](response);
        expect(items).toEqual(response.results);
      });

      it('should support async iteration', async () => {
        const page1 = {
          results: [{ id: '1', key: 'project1', name: 'Project 1', selected: true }],
          paging: { pageIndex: 1, pageSize: 1, total: 2 },
        };
        const page2 = {
          results: [{ id: '2', key: 'project2', name: 'Project 2', selected: false }],
          paging: { pageIndex: 2, pageSize: 1, total: 2 },
        };

        executor.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

        builder.pageSize(1);
        const items: Project[] = [];
        for await (const item of builder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(2);
        expect(items[0].key).toBe('project1');
        expect(items[1].key).toBe('project2');
      });
    });
  });

  describe('AssociateProjectsBuilder', () => {
    let executor: jest.Mock;
    let builder: AssociateProjectsBuilder;

    beforeEach(() => {
      executor = jest.fn();
      builder = new AssociateProjectsBuilder(executor, 'gate-123');
    });

    describe('fluent interface', () => {
      it('should add single project', () => {
        builder.withProject('project1');
        expect(builder['params'].projectKeys).toEqual(['project1']);
      });

      it('should add multiple projects at once', () => {
        builder.withProjects(['project1', 'project2']);
        expect(builder['params'].projectKeys).toEqual(['project1', 'project2']);
      });

      it('should accumulate projects', () => {
        builder
          .withProject('project1')
          .withProject('project2')
          .withProjects(['project3', 'project4']);
        expect(builder['params'].projectKeys).toEqual([
          'project1',
          'project2',
          'project3',
          'project4',
        ]);
      });

      it('should clear projects', () => {
        builder.withProjects(['project1', 'project2']).clearProjects();
        expect(builder['params'].projectKeys).toEqual([]);
      });

      it('should support method chaining', () => {
        const result = builder
          .withProject('project1')
          .withProjects(['project2', 'project3'])
          .withProject('project4');

        expect(result).toBe(builder);
        expect(builder['params']).toMatchObject({
          gateId: 'gate-123',
          projectKeys: ['project1', 'project2', 'project3', 'project4'],
        });
      });
    });

    describe('execute', () => {
      it('should execute with valid parameters', async () => {
        await builder.withProjects(['project1', 'project2']).execute();

        expect(executor).toHaveBeenCalledWith({
          gateId: 'gate-123',
          projectKeys: ['project1', 'project2'],
        });
      });

      it('should throw error when no projects specified', async () => {
        await expect(builder.execute()).rejects.toThrow(
          'At least one project key must be specified'
        );
      });

      it('should throw error when projects array is empty', async () => {
        await expect(builder.clearProjects().execute()).rejects.toThrow(
          'At least one project key must be specified'
        );
      });
    });
  });
});
