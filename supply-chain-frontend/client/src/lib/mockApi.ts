// Mock API for testing without backend
export const mockLogin = (email: string, password: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 1,
          email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
        },
      });
    }, 500);
  });
};

export const mockRegister = (email: string, password: string, firstName: string, lastName: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 1,
          email,
          firstName,
          lastName,
          role: 'user',
        },
      });
    }, 500);
  });
};

export const mockGetProducts = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: 'Laptop',
          sku: 'LAPTOP-001',
          description: 'High-performance laptop',
          unit_price: 999.99,
          stock_quantity: 45,
          reorder_level: 10,
          supplier_id: 1,
          supplier_name: 'Tech Supplies Inc',
        },
        {
          id: 2,
          name: 'Monitor',
          sku: 'MON-002',
          description: '27" 4K Monitor',
          unit_price: 399.99,
          stock_quantity: 8,
          reorder_level: 15,
          supplier_id: 1,
          supplier_name: 'Tech Supplies Inc',
        },
        {
          id: 3,
          name: 'Keyboard',
          sku: 'KEY-003',
          description: 'Mechanical Keyboard',
          unit_price: 149.99,
          stock_quantity: 120,
          reorder_level: 20,
          supplier_id: 2,
          supplier_name: 'Peripherals Co',
        },
        {
          id: 4,
          name: 'Mouse',
          sku: 'MOUSE-004',
          description: 'Wireless Mouse',
          unit_price: 49.99,
          stock_quantity: 5,
          reorder_level: 30,
          supplier_id: 2,
          supplier_name: 'Peripherals Co',
        },
      ]);
    }, 300);
  });
};

export const mockGetProduct = (id: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const products: any = {
        1: {
          id: 1,
          name: 'Laptop',
          sku: 'LAPTOP-001',
          description: 'High-performance laptop',
          unit_price: 999.99,
          stock_quantity: 45,
          reorder_level: 10,
          supplier_id: 1,
          supplier_name: 'Tech Supplies Inc',
        },
        2: {
          id: 2,
          name: 'Monitor',
          sku: 'MON-002',
          description: '27" 4K Monitor',
          unit_price: 399.99,
          stock_quantity: 8,
          reorder_level: 15,
          supplier_id: 1,
          supplier_name: 'Tech Supplies Inc',
        },
      };
      resolve(products[id] || products[1]);
    }, 300);
  });
};

export const mockGetSuppliers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: 'Tech Supplies Inc',
          contact_person: 'Alice Johnson',
          email: 'alice@techsupplies.com',
          phone: '+1-555-0101',
          address: '123 Tech Street, Silicon Valley, CA',
          city: 'Silicon Valley',
          country: 'USA',
          payment_terms: 'Net 30',
        },
        {
          id: 2,
          name: 'Peripherals Co',
          contact_person: 'Bob Smith',
          email: 'bob@peripherals.com',
          phone: '+1-555-0102',
          address: '456 Peripheral Ave, Austin, TX',
          city: 'Austin',
          country: 'USA',
          payment_terms: 'Net 45',
        },
        {
          id: 3,
          name: 'Global Parts Ltd',
          contact_person: 'Carol White',
          email: 'carol@globalparts.com',
          phone: '+44-20-7946-0958',
          address: '789 Global Road, London, UK',
          city: 'London',
          country: 'UK',
          payment_terms: 'Net 60',
        },
      ]);
    }, 300);
  });
};

export const mockGetOrders = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          customer_name: 'Acme Corp',
          status: 'delivered',
          total_amount: 5999.95,
          item_count: 3,
          created_at: '2026-01-15T10:30:00Z',
        },
        {
          id: 2,
          customer_name: 'Global Industries',
          status: 'shipped',
          total_amount: 2499.97,
          item_count: 2,
          created_at: '2026-02-01T14:20:00Z',
        },
        {
          id: 3,
          customer_name: 'Tech Startup Inc',
          status: 'pending',
          total_amount: 1599.98,
          item_count: 4,
          created_at: '2026-02-03T09:15:00Z',
        },
        {
          id: 4,
          customer_name: 'Enterprise Solutions',
          status: 'confirmed',
          total_amount: 8999.96,
          item_count: 5,
          created_at: '2026-02-04T11:45:00Z',
        },
      ]);
    }, 300);
  });
};

export const mockGetOrder = (id: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders: any = {
        1: {
          id: 1,
          customer_name: 'Acme Corp',
          status: 'delivered',
          total_amount: 5999.95,
          created_at: '2026-01-15T10:30:00Z',
          items: [
            {
              id: 1,
              product_id: 1,
              product_name: 'Laptop',
              product_sku: 'LAPTOP-001',
              quantity: 3,
              unit_price: 999.99,
            },
            {
              id: 2,
              product_id: 2,
              product_name: 'Monitor',
              product_sku: 'MON-002',
              quantity: 2,
              unit_price: 399.99,
            },
          ],
        },
        2: {
          id: 2,
          customer_name: 'Global Industries',
          status: 'shipped',
          total_amount: 2499.97,
          created_at: '2026-02-01T14:20:00Z',
          items: [
            {
              id: 3,
              product_id: 3,
              product_name: 'Keyboard',
              product_sku: 'KEY-003',
              quantity: 10,
              unit_price: 149.99,
            },
          ],
        },
      };
      resolve(orders[id] || orders[1]);
    }, 300);
  });
};

export const mockGetAlerts = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          product_id: 2,
          product_name: 'Monitor',
          sku: 'MON-002',
          stock_quantity: 8,
          reorder_level: 15,
          created_at: '2026-02-04T10:00:00Z',
        },
        {
          id: 2,
          product_id: 4,
          product_name: 'Mouse',
          sku: 'MOUSE-004',
          stock_quantity: 5,
          reorder_level: 30,
          created_at: '2026-02-03T15:30:00Z',
        },
      ]);
    }, 300);
  });
};

export const mockGetInventory = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: 'Laptop',
          sku: 'LAPTOP-001',
          stock_quantity: 45,
          reorder_level: 10,
          is_low_stock: false,
        },
        {
          id: 2,
          name: 'Monitor',
          sku: 'MON-002',
          stock_quantity: 8,
          reorder_level: 15,
          is_low_stock: true,
        },
        {
          id: 3,
          name: 'Keyboard',
          sku: 'KEY-003',
          stock_quantity: 120,
          reorder_level: 20,
          is_low_stock: false,
        },
        {
          id: 4,
          name: 'Mouse',
          sku: 'MOUSE-004',
          stock_quantity: 5,
          reorder_level: 30,
          is_low_stock: true,
        },
      ]);
    }, 300);
  });
};
