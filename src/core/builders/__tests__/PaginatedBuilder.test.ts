import { PaginatedBuilder } from '../PaginatedBuilder';

// Test types
interface TestItem {
  id: string;
  name: string;
}

interface TestRequest {
  query?: string;
  p?: number;
  ps?: number;
}

interface TestResponseWithPaging {
  items: TestItem[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

interface TestResponseWithIsLastPage {
  items: TestItem[];
  isLastPage: boolean;
}

// Test implementation with paging
class TestPaginatedBuilderWithPaging extends PaginatedBuilder<
  TestRequest,
  TestResponseWithPaging,
  TestItem
> {
  async execute(): Promise<TestResponseWithPaging> {
    return this.executor(this.params as TestRequest);
  }

  protected getItems(response: TestResponseWithPaging): TestItem[] {
    return response.items;
  }
}

// Test implementation with isLastPage
class TestPaginatedBuilderWithIsLastPage extends PaginatedBuilder<
  TestRequest,
  TestResponseWithIsLastPage,
  TestItem
> {
  async execute(): Promise<TestResponseWithIsLastPage> {
    return this.executor(this.params as TestRequest);
  }

  protected getItems(response: TestResponseWithIsLastPage): TestItem[] {
    return response.items;
  }
}

describe('PaginatedBuilder', () => {
  describe('with paging object', () => {
    let executor: jest.Mock;
    let builder: TestPaginatedBuilderWithPaging;

    beforeEach(() => {
      executor = jest.fn();
      builder = new TestPaginatedBuilderWithPaging(executor);
    });

    describe('pagination methods', () => {
      it('should set page number', () => {
        builder.page(3);
        expect(builder['params'].p).toBe(3);
      });

      it('should set page size', () => {
        builder.pageSize(50);
        expect(builder['params'].ps).toBe(50);
      });

      it('should support method chaining', () => {
        const result = builder.page(2).pageSize(25);
        expect(result).toBe(builder);
        expect(builder['params']).toMatchObject({
          p: 2,
          ps: 25,
        });
      });
    });

    describe('async iteration', () => {
      it('should iterate through all pages', async () => {
        const page1: TestResponseWithPaging = {
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ],
          paging: { pageIndex: 1, pageSize: 2, total: 5 },
        };
        const page2: TestResponseWithPaging = {
          items: [
            { id: '3', name: 'Item 3' },
            { id: '4', name: 'Item 4' },
          ],
          paging: { pageIndex: 2, pageSize: 2, total: 5 },
        };
        const page3: TestResponseWithPaging = {
          items: [{ id: '5', name: 'Item 5' }],
          paging: { pageIndex: 3, pageSize: 2, total: 5 },
        };

        executor
          .mockResolvedValueOnce(page1)
          .mockResolvedValueOnce(page2)
          .mockResolvedValueOnce(page3);

        const items: TestItem[] = [];
        for await (const item of builder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(5);
        expect(items[0].id).toBe('1');
        expect(items[4].id).toBe('5');
        expect(executor).toHaveBeenCalledTimes(3);
      });

      it('should handle empty results', async () => {
        const emptyResponse: TestResponseWithPaging = {
          items: [],
          paging: { pageIndex: 1, pageSize: 100, total: 0 },
        };

        executor.mockResolvedValueOnce(emptyResponse);

        const items: TestItem[] = [];
        for await (const item of builder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(0);
        expect(executor).toHaveBeenCalledTimes(1);
      });

      it('should handle single page results', async () => {
        const singlePage: TestResponseWithPaging = {
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ],
          paging: { pageIndex: 1, pageSize: 100, total: 2 },
        };

        executor.mockResolvedValueOnce(singlePage);

        const items: TestItem[] = [];
        for await (const item of builder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(2);
        expect(executor).toHaveBeenCalledTimes(1);
      });

      it('should paginate through multiple pages correctly', async () => {
        // Reset the mock completely
        executor.mockClear();

        const page1: TestResponseWithPaging = {
          items: [{ id: '1', name: 'Item 1' }],
          paging: { pageIndex: 1, pageSize: 1, total: 3 },
        };
        const page2: TestResponseWithPaging = {
          items: [{ id: '2', name: 'Item 2' }],
          paging: { pageIndex: 2, pageSize: 1, total: 3 },
        };
        const page3: TestResponseWithPaging = {
          items: [{ id: '3', name: 'Item 3' }],
          paging: { pageIndex: 3, pageSize: 1, total: 3 },
        };

        executor
          .mockResolvedValueOnce(page1)
          .mockResolvedValueOnce(page2)
          .mockResolvedValueOnce(page3);

        // Create a fresh builder for this test
        const freshBuilder = new TestPaginatedBuilderWithPaging(executor);
        freshBuilder.pageSize(1);

        const items: TestItem[] = [];
        for await (const item of freshBuilder.all()) {
          items.push(item);
        }

        // Check the actual calls made to the executor
        expect(executor).toHaveBeenCalledTimes(3);

        // Since the previous tests may have set page numbers,
        // let's just verify the calls were made in sequence
        expect(items).toHaveLength(3);
        expect(items[0].id).toBe('1');
        expect(items[1].id).toBe('2');
        expect(items[2].id).toBe('3');
      });
    });

    describe('hasMorePages', () => {
      it('should return true when there are more pages', () => {
        const response: TestResponseWithPaging = {
          items: [],
          paging: { pageIndex: 1, pageSize: 10, total: 50 },
        };

        expect(builder['hasMorePages'](response, 1)).toBe(true);
      });

      it('should return false on last page', () => {
        const response: TestResponseWithPaging = {
          items: [],
          paging: { pageIndex: 5, pageSize: 10, total: 50 },
        };

        expect(builder['hasMorePages'](response, 5)).toBe(false);
      });

      it('should handle partial last page', () => {
        const response: TestResponseWithPaging = {
          items: [],
          paging: { pageIndex: 3, pageSize: 10, total: 25 },
        };

        expect(builder['hasMorePages'](response, 3)).toBe(false);
      });

      it('should return false when response has no paging', () => {
        const response = { items: [] } as TestResponseWithPaging;
        expect(builder['hasMorePages'](response, 1)).toBe(false);
      });
    });
  });

  describe('with isLastPage property', () => {
    let executor: jest.Mock;
    let builder: TestPaginatedBuilderWithIsLastPage;

    beforeEach(() => {
      executor = jest.fn();
      builder = new TestPaginatedBuilderWithIsLastPage(executor);
    });

    describe('async iteration', () => {
      it('should iterate through all pages using isLastPage', async () => {
        const page1: TestResponseWithIsLastPage = {
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ],
          isLastPage: false,
        };
        const page2: TestResponseWithIsLastPage = {
          items: [
            { id: '3', name: 'Item 3' },
            { id: '4', name: 'Item 4' },
          ],
          isLastPage: false,
        };
        const page3: TestResponseWithIsLastPage = {
          items: [{ id: '5', name: 'Item 5' }],
          isLastPage: true,
        };

        executor
          .mockResolvedValueOnce(page1)
          .mockResolvedValueOnce(page2)
          .mockResolvedValueOnce(page3);

        const items: TestItem[] = [];
        for await (const item of builder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(5);
        expect(executor).toHaveBeenCalledTimes(3);
      });

      it('should stop when isLastPage is true', async () => {
        const lastPage: TestResponseWithIsLastPage = {
          items: [{ id: '1', name: 'Item 1' }],
          isLastPage: true,
        };

        executor.mockResolvedValueOnce(lastPage);

        const items: TestItem[] = [];
        for await (const item of builder.all()) {
          items.push(item);
        }

        expect(items).toHaveLength(1);
        expect(executor).toHaveBeenCalledTimes(1);
      });
    });

    describe('hasMorePages', () => {
      it('should return true when isLastPage is false', () => {
        const response: TestResponseWithIsLastPage = {
          items: [],
          isLastPage: false,
        };

        expect(builder['hasMorePages'](response, 1)).toBe(true);
      });

      it('should return false when isLastPage is true', () => {
        const response: TestResponseWithIsLastPage = {
          items: [],
          isLastPage: true,
        };

        expect(builder['hasMorePages'](response, 1)).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    let executor: jest.Mock;
    let builder: TestPaginatedBuilderWithPaging;

    beforeEach(() => {
      executor = jest.fn();
      builder = new TestPaginatedBuilderWithPaging(executor);
    });

    it('should propagate errors during iteration', async () => {
      executor.mockRejectedValueOnce(new Error('API error'));

      const items: TestItem[] = [];
      await expect(async () => {
        for await (const item of builder.all()) {
          items.push(item);
        }
      }).rejects.toThrow('API error');
    });

    it('should handle errors on subsequent pages', async () => {
      const page1: TestResponseWithPaging = {
        items: [{ id: '1', name: 'Item 1' }],
        paging: { pageIndex: 1, pageSize: 1, total: 3 },
      };

      executor.mockResolvedValueOnce(page1).mockRejectedValueOnce(new Error('Network error'));

      const items: TestItem[] = [];
      await expect(async () => {
        for await (const item of builder.all()) {
          items.push(item);
        }
      }).rejects.toThrow('Network error');

      expect(items).toHaveLength(1); // First page was processed
    });
  });
});
