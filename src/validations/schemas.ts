import { z } from 'zod'

const safeTextPattern = /^[^<>{}`\x00-\x1F\x7F]+$/

const requiredSafeText = (field: string, max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, `${field} es requerido`)
        .max(max, `Maximo ${max} caracteres`)
        .regex(safeTextPattern, `${field} contiene caracteres no permitidos`),
    )

// Auth
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email valido (ej: usuario@empresa.com)'),
  password: z
    .string()
    .min(1, 'La contrasena es requerida')
    .min(6, 'Minimo 6 caracteres'),
})

export const createUserSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(3, 'Minimo 3 caracteres')
      .max(80, 'Maximo 80 caracteres')
      .regex(/^[\p{L}\s]+$/u, 'Solo letras y espacios'),
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresa un email valido (ej: usuario@empresa.com)'),
    password: z
      .string()
      .min(6, 'Minimo 6 caracteres')
      .max(72, 'Maximo 72 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayuscula')
      .regex(/[0-9]/, 'Debe incluir al menos un numero'),
    confirmPassword: z.string().min(1, 'Confirma la contrasena'),
    role: z.enum(['admin', 'bodeguero', 'viewer'], {
      errorMap: () => ({ message: 'Selecciona un rol valido' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

// Productos
export const productSchema = z.object({
  code: z
    .string()
    .min(1, 'El codigo es requerido')
    .max(20, 'Maximo 20 caracteres')
    .regex(/^[A-Z0-9\-]+$/, 'Solo letras mayusculas, numeros y guiones (ej: PRD-001)'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'Minimo 3 caracteres')
    .max(120, 'Maximo 120 caracteres'),
  category_id: z
    .number({ invalid_type_error: 'Selecciona una categoria' })
    .int()
    .positive('Selecciona una categoria'),
  unit: z
    .string()
    .min(1, 'La unidad es requerida')
    .max(30, 'Maximo 30 caracteres'),
  location: z
    .string()
    .min(1, 'La ubicacion es requerida')
    .max(20, 'Maximo 20 caracteres'),
  stock: z
    .number({ invalid_type_error: 'El stock debe ser un numero' })
    .int('Debe ser numero entero')
    .min(0, 'No puede ser negativo'),
  min_stock: z
    .number({ invalid_type_error: 'El stock minimo debe ser un numero' })
    .int('Debe ser numero entero')
    .min(0, 'No puede ser negativo'),
  price: z
    .number({ invalid_type_error: 'El precio debe ser un numero' })
    .min(0, 'No puede ser negativo'),
})

export const editProductSchema = productSchema.partial({ stock: true })

// Movimientos
export const recepcionSchema = z.object({
  product_id: z
    .string()
    .uuid('Selecciona un producto valido')
    .min(1, 'Selecciona un producto'),
  quantity: z
    .number({ invalid_type_error: 'La cantidad debe ser un numero' })
    .int('Debe ser numero entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(99999, 'Cantidad demasiado grande'),
  reference: requiredSafeText('La referencia', 50),
  provider: requiredSafeText('El proveedor', 80),
  notes: requiredSafeText('Las observaciones', 200),
})

export const despachoSchema = z.object({
  product_id: z
    .string()
    .uuid('Selecciona un producto valido')
    .min(1, 'Selecciona un producto'),
  quantity: z
    .number({ invalid_type_error: 'La cantidad debe ser un numero' })
    .int('Debe ser numero entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(99999, 'Cantidad demasiado grande'),
  reference: requiredSafeText('La referencia', 50),
  requester: requiredSafeText('El solicitante', 80),
  notes: requiredSafeText('Las observaciones', 200),
})

// Tipos inferidos
export type LoginFormData       = z.infer<typeof loginSchema>
export type CreateUserFormData  = z.infer<typeof createUserSchema>
export type ProductFormData     = z.infer<typeof productSchema>
export type RecepcionFormData   = z.infer<typeof recepcionSchema>
export type DespachoFormData    = z.infer<typeof despachoSchema>
