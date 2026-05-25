# 📦 StockFlow — Plataforma de Gestión de Inventario

Stack: **React 18 + TypeScript + Tailwind CSS + Supabase**

---

## 🚀 Instalación paso a paso

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar Supabase

#### a) Crea tu proyecto gratuito en [supabase.com](https://app.supabase.com)

#### b) Ve a **SQL Editor** y ejecuta el archivo:
```
supabase/schema.sql
```
Esto crea todas las tablas, triggers, RLS policies y datos de ejemplo.

#### c) Copia las credenciales
En tu proyecto Supabase → **Settings → API**, copia:
- `Project URL`
- `anon public` key

#### d) Crea el archivo `.env`
```bash
cp .env.example .env
```
Pega tus credenciales:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Crear usuarios de demo en Supabase Auth

En **Supabase → Authentication → Users → Add user**, crea:

| Email                       | Contraseña          | Rol        |
|-----------------------------|---------------------|------------|
| admin@stockflow.com         | Admin123            | admin      |
| bodega@stockflow.com        | NuevaB0degA1245     | bodeguero  |
| viewer@stockflow.com        | NuevoV1s1tante145   | viewer     |

> ⚠️ Después de crear cada usuario, actualiza su rol en la tabla `profiles`:
> ```sql
> UPDATE profiles SET role = 'admin'     WHERE email IN (SELECT email FROM auth.users WHERE email = 'admin@stockflow.com');
> UPDATE profiles SET role = 'bodeguero' WHERE id IN (SELECT id FROM auth.users WHERE email = 'bodega@stockflow.com');
> ```

### 4. Levantar el servidor de desarrollo

```bash
pnpm dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## 🏗️ Estructura del proyecto

```
src/
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx      # Sidebar + Topbar + routing
│   └── ui/
│       └── index.tsx          # Button, Input, Select, Modal, Badge, Card...
├── hooks/
│   ├── useProducts.ts         # CRUD productos + realtime
│   ├── useMovements.ts        # Historial + realtime
│   ├── useCategories.ts       # Categorías
│   └── useAlertCount.ts       # Badge de alertas
├── lib/
│   ├── supabase.ts            # Cliente Supabase
│   ├── authStore.ts           # Estado global de auth (Zustand)
│   ├── exports.ts             # Exportación PDF y Excel
│   └── utils.ts               # Helpers y formatters
├── pages/
│   ├── LoginPage.tsx          # Login con validación Zod
│   ├── DashboardPage.tsx      # KPIs y resumen
│   ├── InventarioPage.tsx     # CRUD de productos
│   ├── RecepcionPage.tsx      # Entradas de mercancía
│   ├── DespachoPage.tsx       # Salidas de mercancía
│   ├── HistorialPage.tsx      # Todos los movimientos
│   ├── AlertasPage.tsx        # Stock crítico y bajo
│   ├── ReportesPage.tsx       # Exportación PDF/Excel
│   ├── AdminPage.tsx          # Gestión de usuarios
│   └── ConfigPage.tsx         # Configuración del sistema
├── types/
│   └── index.ts               # Tipos TypeScript globales
├── validations/
│   └── schemas.ts             # Todos los schemas Zod
├── App.tsx                    # Root + auth listener
└── main.tsx                   # Entry point
supabase/
└── schema.sql                 # Tablas + RLS + funciones RPC
```

---

## 🔐 Roles y permisos

| Módulo           | Admin | Bodeguero | Viewer |
|------------------|:-----:|:---------:|:------:|
| Dashboard        | ✅    | ✅        | ✅     |
| Inventario (ver) | ✅    | ✅        | ✅     |
| Inventario (CRUD)| ✅    | ✅        | ❌     |
| Eliminar producto| ✅    | ❌        | ❌     |
| Recepción        | ✅    | ✅        | ❌     |
| Despacho         | ✅    | ✅        | ❌     |
| Historial        | ✅    | ✅        | ✅     |
| Alertas          | ✅    | ✅        | ✅     |
| Reportes         | ✅    | ✅        | ✅     |
| Usuarios (Admin) | ✅    | ❌        | ❌     |
| Configuración    | ✅    | ❌        | ❌     |

---

## ✅ Validaciones implementadas (Zod)

- **Email**: formato válido obligatorio (rechaza `#gmail`, espacios, etc.)
- **Contraseña nueva**: mínimo 6 chars, al menos 1 mayúscula y 1 número
- **Confirmación de contraseña**: debe coincidir
- **Nombre**: solo letras y espacios, 3–80 caracteres
- **Código de producto**: solo mayúsculas, números y guiones (`PRD-001`)
- **Cantidades**: enteros positivos, no negativos
- **Stock mínimo**: entero >= 0
- **Precio**: decimal >= 0
- **Campos requeridos**: marcados con `*` y mensaje inline
