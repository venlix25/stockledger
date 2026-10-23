/**
 * Fully chainable In-memory Mock Supabase Client for Automated Testing
 */
export class MockDatabase {
  orders: Map<string, any> = new Map();
  subscriptions: Map<string, any> = new Map();
  policyAcceptances: any[] = [];
  shouldFail: boolean = false;

  reset() {
    this.orders.clear();
    this.subscriptions.clear();
    this.policyAcceptances = [];
    this.shouldFail = false;
  }

  from(table: string) {
    if (this.shouldFail) {
      const errorFn = () => ({
        eq: errorFn,
        order: errorFn,
        limit: errorFn,
        single: async () => ({ data: null, error: new Error("Simulated Database I/O Failure") }),
        maybeSingle: async () => ({ data: null, error: new Error("Simulated Database I/O Failure") }),
      });
      return {
        select: errorFn,
        insert: async () => ({ data: null, error: new Error("Simulated Database I/O Failure") }),
        update: () => ({ eq: errorFn }),
      };
    }

    const getCollection = () => {
      if (table === "orders") return this.orders;
      if (table === "subscriptions") return this.subscriptions;
      return null;
    };

    if (table === "policy_acceptances") {
      return {
        insert: async (records: any[]) => {
          const toAdd = Array.isArray(records) ? records : [records];
          this.policyAcceptances.push(...toAdd);
          return { data: toAdd, error: null };
        },
      };
    }

    const collection = getCollection();
    if (!collection) {
      throw new Error(`Unknown table in mock: ${table}`);
    }

    return {
      select: () => {
        const filters: Array<{ col: string; val: any }> = [];
        let orderBy: { col: string; ascending: boolean } | null = null;
        let limitCount: number | null = null;

        const chain = {
          eq: (col: string, val: any) => {
            filters.push({ col, val });
            return chain;
          },
          order: (col: string, options?: { ascending?: boolean }) => {
            orderBy = { col, ascending: options?.ascending ?? true };
            return chain;
          },
          limit: (n: number) => {
            limitCount = n;
            return chain;
          },
          execute: () => {
            let results: any[] = [];
            const items = Array.from(collection.values());
            for (const item of items) {
              const matches = filters.every((f) => item[f.col] === f.val);
              if (matches) results.push({ ...item });
            }
            if (orderBy) {
              const { col, ascending } = orderBy;
              results.sort((a, b) => {
                if (a[col] < b[col]) return ascending ? -1 : 1;
                if (a[col] > b[col]) return ascending ? 1 : -1;
                return 0;
              });
            }
            if (limitCount !== null) {
              results = results.slice(0, limitCount);
            }
            return results;
          },
          single: async () => {
            const results = chain.execute();
            if (results.length > 0) return { data: results[0], error: null };
            return { data: null, error: { message: "Record not found" } };
          },
          maybeSingle: async () => {
            const results = chain.execute();
            if (results.length > 0) return { data: results[0], error: null };
            return { data: null, error: null };
          },
        };

        return chain;
      },

      insert: async (data: any) => {
        const id = data.id || `${table}-${Date.now()}-${Math.random()}`;
        const record = { id, ...data, created_at: new Date().toISOString() };
        collection.set(id, record);
        return {
          data: record,
          error: null,
          select: () => ({
            single: async () => ({ data: record, error: null }),
          }),
        };
      },

      update: (updates: any) => {
        const filters: Array<{ col: string; val: any }> = [];
        const updateChain = {
          eq: (col: string, val: any) => {
            filters.push({ col, val });
            // Apply updates to matching records
            let matched = null;
            const entries = Array.from(collection.entries());
            for (const [id, item] of entries) {
              const matches = filters.every((f) => item[f.col] === f.val);
              if (matches) {
                matched = { ...item, ...updates, updated_at: new Date().toISOString() };
                collection.set(id, matched);
              }
            }
            return updateChain;
          },
        };
        return updateChain;
      },
    };
  }
}
