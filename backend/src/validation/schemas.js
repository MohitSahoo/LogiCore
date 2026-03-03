import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Product Schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  unit_price: z.number().positive('Unit price must be positive'),
  stock_quantity: z.number().int().nonnegative('Stock quantity must be non-negative'),
  reorder_level: z.number().int().positive('Reorder level must be positive'),
  supplier_id: z.number().int().positive().optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  unit_price: z.number().positive('Unit price must be positive'),
  stock_quantity: z.number().int().nonnegative('Stock quantity must be non-negative'),
  reorder_level: z.number().int().positive('Reorder level must be positive'),
  supplier_id: z.number().int().positive().optional().nullable(),
});

// Supplier Schemas
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

// Order Schemas
export const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  items: z.array(z.object({
    product_id: z.number().int().positive('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
    unit_price: z.number().positive('Unit price must be positive').optional(),
  })).min(1, 'At least one item is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Status must be PENDING, COMPLETED, or CANCELLED' })
  }),
});

// AI Report Schemas
export const generateReportSchema = z.object({
  type: z.enum(['weekly', 'monthly'], {
    errorMap: () => ({ message: 'Type must be weekly or monthly' })
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});
