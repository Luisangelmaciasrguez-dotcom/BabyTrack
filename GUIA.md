# Guía: cómo publicar BabyTrack (gratis)

La ruta completa toma unos 30–45 minutos y no necesitas instalar nada en tu
computadora: todo se hace desde el navegador. Al final tendrán la app en sus
dos teléfonos, con el historial compartido en tiempo real.

La guía tiene dos partes:

- **Parte A (pasos 1–4):** publicar la app y ponerla en sus teléfonos.
  Al terminar ya funciona, pero cada teléfono guarda su propio historial.
- **Parte B (pasos 5–7):** conectar la base de datos para que los dos vean
  y registren sobre el mismo historial.

---

## Parte A — Publicar la app

### Paso 1. Crea una cuenta en GitHub

1. Entra a https://github.com y crea una cuenta gratuita (si no tienen una).
2. Ya dentro, presiona el botón **"+"** (arriba a la derecha) → **New repository**.
3. Ponle de nombre `babytrack`, déjalo **Public**, y marca la casilla
   **"Add a README file"** (esto es importante para poder subir archivos
   desde el navegador). Presiona **Create repository**.

### Paso 2. Sube los archivos del proyecto

1. Descomprime el archivo `babytrack-app.zip` en tu computadora.
2. En tu repositorio de GitHub, presiona **Add file → Upload files**.
3. Abre la carpeta descomprimida `babytrack-app` y **arrastra todo su
   CONTENIDO** (no la carpeta en sí) a la página de GitHub: deben verse
   `package.json`, `index.html`, `vite.config.js`, las carpetas `src` y
   `public`, etc.
   - GitHub sí conserva las carpetas al arrastrarlas, así que puedes
     arrastrar `src` y `public` completas.
4. Abajo presiona **Commit changes**.

### Paso 3. Publícala en Vercel

1. Entra a https://vercel.com y elige **Sign up → Continue with GitHub**
   (así se conectan solas las dos cuentas).
2. En el panel de Vercel: **Add New… → Project**.
3. Busca el repositorio `babytrack` y presiona **Import**.
4. Vercel detecta solo que es un proyecto Vite. No cambies nada y presiona
   **Deploy**.
5. En un minuto te da una dirección tipo `https://babytrack-xxxx.vercel.app`.
   ¡Esa es su app! Ábrela y pruébala.

> Cada vez que subas un cambio al repositorio de GitHub, Vercel vuelve a
> publicar la app automáticamente.

### Paso 4. Instálenla en sus teléfonos

Abran la dirección de Vercel en el celular y:

- **iPhone (Safari):** botón de compartir (cuadro con flecha) →
  **Agregar a pantalla de inicio**.
- **Android (Chrome):** menú **⋮** → **Agregar a la pantalla principal**
  (o el aviso de "Instalar app" si aparece).

Queda con su ícono lila y abre a pantalla completa, como cualquier app.

En este punto la app ya guarda los datos en cada teléfono (aunque la
cierres o reinicies el celular), pero **todavía no se comparten entre los
dos**. Para eso sigue la Parte B.

---

## Parte B — Compartir el historial entre los dos

### Paso 5. Crea la base de datos en Supabase

1. Entra a https://supabase.com y crea una cuenta gratuita (puedes usar
   **Continue with GitHub**).
2. **New project**: ponle nombre `babytrack`, inventa una contraseña de
   base de datos (guárdala, aunque no la usarás en la app) y elige la
   región más cercana (para México, una región de EE. UU. funciona bien).
   Espera 1–2 minutos a que se cree.
3. En el menú izquierdo abre **SQL Editor → New query**.
4. Abre el archivo `supabase_setup.sql` (viene en el zip), copia TODO su
   contenido, pégalo en el editor y presiona **Run**. Debe decir
   "Success".
5. Ahora ve a **Settings (engrane) → API** y copia dos cosas:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - **anon public** key (una clave larga, en la sección "Project API keys")

### Paso 6. Conecta Vercel con Supabase

1. En Vercel, entra a tu proyecto → **Settings → Environment Variables**.
2. Agrega estas dos variables (nombre exacto, valor lo que copiaste):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | tu Project URL |
   | `VITE_SUPABASE_ANON_KEY` | tu llave anon public |

3. Para que tomen efecto: pestaña **Deployments** → en el último
   deployment presiona el menú **⋯ → Redeploy**.

### Paso 7. Pongan el mismo código de familia

1. Abre la app en tu teléfono → engrane de **Configuración** →
   sección **Sincronización familiar**.
2. Inventa un **código de familia largo y difícil de adivinar**
   (ej. `luna-valentina-2026-xk7`) y presiona **Guardar**.
3. Tu esposa abre la app en su teléfono y escribe **exactamente el mismo
   código**.

Listo: lo que registre cualquiera de los dos aparece en el otro teléfono
en segundos, sin recargar.

---

## Cosas buenas que saber

- **Privacidad:** los datos quedan protegidos únicamente por el secreto de
  su código de familia (no hay usuarios ni contraseñas). Para uso familiar
  está bien, pero usen un código largo, no lo compartan y eviten guardar
  información muy delicada.
- **Costo:** GitHub, Vercel y Supabase son gratis en los niveles que
  ustedes usarán. Supabase puede "pausar" proyectos gratuitos tras ~7 días
  sin uso; como ustedes la usarán a diario no debería pasar, y si pasa, se
  reactiva con un clic en su panel.
- **Respaldo:** además de la nube, cada teléfono guarda una copia local,
  así que la app funciona aunque se vaya el internet (sincroniza al volver).
- **Notificaciones de medicamentos:** funcionan mientras la app esté
  abierta. En iPhone, las notificaciones de apps web requieren tenerla
  agregada a pantalla de inicio y aceptar el permiso.
- **¿Cambios futuros?** Edita los archivos directamente en GitHub (icono
  de lápiz) o pídele a Claude la modificación y sube el archivo nuevo;
  Vercel publica solo.

## Probar en tu computadora (opcional)

Si tienes Node.js instalado:

```
npm install
npm run dev
```

y abre http://localhost:5173. Para probar la sincronización local, copia
`.env.example` como `.env` y pon ahí tus llaves de Supabase.
