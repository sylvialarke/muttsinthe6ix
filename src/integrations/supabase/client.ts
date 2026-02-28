// Stub supabase client - replace with real Supabase client when ready
// import { createClient } from '@supabase/supabase-js';

const createMockResponse = (data: any = null, error: any = null) => ({
  data,
  error,
  count: null,
  status: 200,
  statusText: "OK",
});

const createQueryBuilder = () => {
  const builder: any = {
    select: () => builder,
    insert: (data: any) => {
      const record = Array.isArray(data) ? data[0] : data;
      builder._data = { id: crypto.randomUUID(), ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      return builder;
    },
    update: (data: any) => {
      builder._data = { ...data };
      return builder;
    },
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    lt: () => builder,
    gte: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    is: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () => createMockResponse(builder._data || { id: "mock" }),
    maybeSingle: () => createMockResponse(null),
    then: (resolve: any) => resolve(createMockResponse(builder._data ? [builder._data] : [])),
    _data: null,
  };
  return builder;
};

export const supabase = {
  from: (_table: string) => createQueryBuilder(),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
};
