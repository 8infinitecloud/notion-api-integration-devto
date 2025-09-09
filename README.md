# Notion to Dev.to Integration

Automatiza la publicación de artículos desde Notion hacia Dev.to. Este script busca páginas marcadas como "Done" en tu base de datos de Notion y las publica automáticamente en Dev.to como borradores, convirtiendo el contenido rico de Notion a Markdown.

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
| **Status** | Status | "Backlog", "Done", "Published" | Estado de publicación |
| **Tags** | Multi-select | - | Tags para Dev.to (opcional) |
| **Dev.to URL** | URL | - | Se llena automáticamente tras publicar |

### Flujo de estados:

1. **Backlog** → Artículo en desarrollo
2. **Done** → Listo para publicar en Dev.to
3. **Published** → Ya publicado en Dev.to (se asigna automáticamente)

## Tipos de Contenido Soportados

### ✅ Contenido de Texto
- **Párrafos** → Texto normal con formato
- **Heading 1, 2, 3** → `# ## ###` 
- **Texto en negrita** → `**texto**`
- **Texto en cursiva** → `*texto*`
- **Código inline** → `\`código\``
- **Tachado** → `~~texto~~`
- **Enlaces** → `[texto](url)`

### ✅ Listas
- **Listas con viñetas** → `- item`
- **Listas numeradas** → `1. item`

### ✅ Bloques Especiales
- **Bloques de código** → `\`\`\`language\ncode\n\`\`\``
- **Citas** → `> texto`
- **Callouts** → `💡 **texto**`
- **Divisores** → `---`

### ✅ Multimedia
- **Imágenes** → `![alt](url)` con caption
- **Videos de YouTube** → `{% youtube url %}`
- **Videos de Vimeo** → `{% vimeo url %}`
- **Otros videos** → `[🎥 Video](url)`

### ✅ Contenido Embebido
- **Twitter/X** → `{% twitter url %}`
- **CodePen** → `{% codepen url %}`
- **GitHub** → `{% github url %}`
- **Bookmarks** → `[título](url)`
- **Link previews** → `[url](url)`

### ⚠️ Limitaciones
- **Tablas** → Conversión básica (requiere mejoras)
- **Bases de datos anidadas** → No soportado
- **Archivos** → Solo URLs públicas
- **Fórmulas** → No soportado

## Uso

### Publicar artículos

1. **Prepara tu contenido en Notion:**
   - Escribe tu artículo en una página de la base de datos
   - Usa cualquier tipo de contenido soportado
   - Asegúrate de que tenga un título
   - Cambia el Status a "Done"
   - Opcionalmente, agrega tags

2. **Ejecuta el script:**
   ```bash
   npm start
   ```

3. **El script automáticamente:**
   - Busca páginas con status "Done"
   - Convierte todo el contenido a Markdown
   - Publica en Dev.to como borrador
   - Actualiza el status a "Published"
   - Guarda la URL de Dev.to en la base de datos

### Desarrollo

Para desarrollo con auto-reload:
```bash
npm run dev
```

## Mensajes del Sistema

- `🔍 Buscando páginas con status "Done"...`
- `ℹ️ No se encontraron páginas para publicar` - No hay artículos listos
- `📝 Encontradas X páginas para publicar` - Se encontraron artículos
- `📤 Publicando: [título]` - Procesando artículo
- `✅ Publicado: [título] -> [url]` - Artículo publicado exitosamente
- `🎉 Proceso completado. X artículos publicados` - Proceso terminado
- `❌ Error durante la publicación: [error]` - Error en el proceso
- `⚠️ Tipo de bloque no soportado: [tipo]` - Contenido no convertible

## Notas Importantes

- Los artículos se publican como **borradores** en Dev.to
- Debes revisar y publicar manualmente desde Dev.to
- El script no sobrescribe artículos ya publicados
- Solo procesa páginas con status "Done"
- Las imágenes deben ser públicamente accesibles
- Los embeds usan la sintaxis específica de Dev.to

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

### Imágenes no se muestran
- Verifica que las URLs de las imágenes sean públicas
- Las imágenes de Notion tienen URLs temporales

### Embeds no funcionan
- Verifica que uses la sintaxis correcta de Dev.to
- Algunos embeds requieren URLs específicas

## Estructura del Proyecto

```
notion-api-integration-devto/
├── index.js          # Script principal con conversión de contenido
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

### Tipos de contenido pendientes por implementar:
- Tablas complejas
- Bases de datos anidadas
- Archivos adjuntos
- Fórmulas de Notion
- Sincronización bidireccional
