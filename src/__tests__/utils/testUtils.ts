
// Test utilities
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: {}, error: null }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    }))
  }
};

export const mockClient = {
  id: 'test-client-id',
  name: 'Test Client',
  type: 'PF' as const,
  cpf: '123.456.789-00',
  email: 'test@example.com',
  phone: '(11) 99999-9999',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  company_id: 'test-company-id'
};

export const mockUser = {
  id: 'test-user-id',
  email: 'user@test.com'
};

export const mockCompanyInfo = {
  id: 'test-company-id',
  name: 'Test Company'
};
