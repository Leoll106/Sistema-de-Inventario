import { z } from 'zod'

// ─────────────────────────────────────────────
// VALIDACIONES CON ZOD
// ─────────────────────────────────────────────

// ── Auth ─────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido (ej: usuario@empresa.com)'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres'),
})

export const createUserSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(3, 'Mínimo 3 caracteres')
      .max(80, 'Máximo 80 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo letras y espacios'),
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresa un email válido (ej: usuario@empresa.com)'),
    password: z
      .string()
      .min(6, 'Mínimo 6 caracteres')
      .max(72, 'Máximo 72 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmPassword: z.string().min(1, 'Confirma la contraseña'),
    role: z.enum(['admin', 'bodeguero', 'viewer'], {
      errorMap: () => ({ message: 'Selecciona un rol válido' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

// ── Productos ────────────────────────────────
export const productSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es requerido')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9\-]+$/, 'Solo letras mayúsculas, números y guiones (ej: PRD-001)'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(120, 'Máximo 120 caracteres'),
  category_id: z
    .number({ invalid_type_error: 'Selecciona una categoría' })
    .int()
    .positive('Selecciona una categoría'),
  unit: z
    .string()
    .min(1, 'La unidad es requerida')
    .max(30, 'Máximo 30 caracteres'),
  location: z
    .string()
    .min(1, 'La ubicación es requerida')
    .max(20, 'Máximo 20 caracteres'),
  stock: z
    .number({ invalid_type_error: 'El stock debe ser un número' })
    .int('Debe ser número entero')
    .min(0, 'No puede ser negativo'),
  min_stock: z
    .number({ invalid_type_error: 'El stock mínimo debe ser un número' })
    .int('Debe ser número entero')
    .min(0, 'No puede ser negativo'),
  price: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .min(0, 'No puede ser negativo'),
})

export const editProductSchema = productSchema.partial({ stock: true })

// ── Movimientos ──────────────────────────────
export const recepcionSchema = z.object({
  product_id: z
    .string()
    .uuid('Selecciona un producto válido')
    .min(1, 'Selecciona un producto'),
  quantity: z
    .number({ invalid_type_error: 'La cantidad debe ser un número' })
    .int('Debe ser número entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(99999, 'Cantidad demasiado grande'),
  reference: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  provider: z
    .string()
    .max(80, 'Máximo 80 caracteres')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
})

export const despachoSchema = z.object({
  product_id: z
    .string()
    .uuid('Selecciona un producto válido')
    .min(1, 'Selecciona un producto'),
  quantity: z
    .number({ invalid_type_error: 'La cantidad debe ser un número' })
    .int('Debe ser número entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(99999, 'Cantidad demasiado grande'),
  reference: z
    .string()
    .max(50, 'Máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  requester: z
    .string()
    .max(80, 'Máximo 80 caracteres')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional()
    .or(z.literal('')),
})

// ── Tipos inferidos ──────────────────────────
export type LoginFormData       = z.infer<typeof loginSchema>
export type CreateUserFormData  = z.infer<typeof createUserSchema>
export type ProductFormData     = z.infer<typeof productSchema>
export type RecepcionFormData   = z.infer<typeof recepcionSchema>
export type DespachoFormData    = z.infer<typeof despachoSchema>
