# Notion to Dev.to Integration

Automatiza la publicación de artículos desde Notion hacia Dev.to. Este script busca páginas marcadas como "Published" en tu base de datos de Notion y las publica automáticamente en Dev.to como borradores.

## Requisitos Previos

- Node.js (versión 14 o superior)
- Una cuenta en Notion con acceso a la API
- Una cuenta en Dev.to con API key
- Una base de datos configurada en Notion

## Instalación

1. **Clona o descarga este repositorio**

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` con tus credenciales:
   ```
   NOTION_API_KEY=tu_token_de_notion
   NOTION_DATABASE_ID=id_de_tu_base_de_datos
   DEVTO_API_KEY=tu_api_key_de_devto
   ```

## Configuración de APIs

### 1. Notion API Key

1. Ve a [Notion Integrations](https://www.notion.so/my-integrations)
2. Haz clic en "New integration"
3. Dale un nombre a tu integración
4. Selecciona el workspace donde está tu base de datos
5. Copia el "Internal Integration Token"
6. **Importante:** Comparte tu base de datos con la integración:
   - Abre tu base de datos en Notion
   - Haz clic en "Share" → "Invite"
   - Busca tu integración y agrégala

### 2. Database ID de Notion

1. Abre tu base de datos en Notion
2. Copia el ID de la URL:
   ```
   https://notion.so/workspace/DATABASE_ID?v=view_id
   ```
   El `DATABASE_ID` es la parte entre el workspace y el `?v=`

### 3. Dev.to API Key

1. Ve a [Dev.to Settings - Extensions](https://dev.to/settings/extensions)
2. En la sección "DEV Community API Keys"
3. Genera un nuevo API key
4. Copia el token generado

## Estructura de la Base de Datos en Notion

Tu base de datos debe tener exactamente estas propiedades:

| Propiedad | Tipo | Opciones | Descripción |
|-----------|------|----------|-------------|
| **Title** | Title | - | Título del artículo |
| **Status** | Select | "Draft", "Published", "Posted" | Estado de publicación |
| **Tags** | Multi-select | - | Tags para Dev.to (opcional) |
| **Dev.to URL** | URL | - | Se llena automáticamente tras publicar |

### Flujo de estados:

1. **Draft** → Artículo en borrador
2. **Published** → Listo para publicar en Dev.to
3. **Posted** → Ya publicado en Dev.to (se asigna automáticamente)

## Uso

### Publicar artículos

1. **Prepara tu contenido en Notion:**
   - Escribe tu artículo en una página de la base de datos
   - Asegúrate de que tenga un título
   - Cambia el Status a "Published"
   - Opcionalmente, agrega tags

2. **Ejecuta el script:**
   ```bash
   npm start
   ```

3. **El script automáticamente:**
   - Busca páginas con status "Published"
   - Convierte el contenido a Markdown
   - Publica en Dev.to como borrador
   - Actualiza el status a "Posted"
   - Guarda la URL de Dev.to en la base de datos

### Desarrollo

Para desarrollo con auto-reload:
```bash
npm run dev
```

## Tipos de Contenido Soportados

El script actualmente convierte:
- **Párrafos** → Texto normal
- **Heading 1** → `# Título`
- **Heading 2** → `## Subtítulo`

## Mensajes del Sistema

- `🔍 Buscando páginas con status "Published"...`
- `ℹ️ No se encontraron páginas para publicar` - No hay artículos listos
- `📝 Encontradas X páginas para publicar` - Se encontraron artículos
- `📤 Publicando: [título]` - Procesando artículo
- `✅ Publicado: [título] -> [url]` - Artículo publicado exitosamente
- `🎉 Proceso completado. X artículos publicados` - Proceso terminado
- `❌ Error durante la publicación: [error]` - Error en el proceso

## Notas Importantes

- Los artículos se publican como **borradores** en Dev.to
- Debes revisar y publicar manualmente desde Dev.to
- El script no sobrescribe artículos ya publicados
- Solo procesa páginas con status "Published"

## Solución de Problemas

### Error: "Unauthorized"
- Verifica que tu Notion API key sea correcta
- Asegúrate de haber compartido la base de datos con tu integración

### Error: "Database not found"
- Verifica que el Database ID sea correcto
- Confirma que la integración tenga acceso a la base de datos

### Error: "Invalid Dev.to API key"
- Verifica tu API key de Dev.to
- Asegúrate de que tenga permisos de escritura

## Estructura del Proyecto

```
notion-api-integration-devto/
├── index.js          # Script principal
├── package.json      # Dependencias
├── .env.example      # Plantilla de variables de entorno
├── .env              # Variables de entorno (no incluido en git)
├── .github/
│   └── workflows/
│       └── publish.yml # GitHub Actions
└── README.md         # Este archivo
```

## Contribuir

Si encuentras bugs o quieres agregar funcionalidades:
1. Crea un issue describiendo el problema/mejora
2. Fork el repositorio
3. Crea una rama para tu feature
4. Envía un pull request
