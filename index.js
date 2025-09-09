require('dotenv').config();
const { Client } = require('@notionhq/client');
const axios = require('axios');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const devtoApiKey = process.env.DEVTO_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

async function getNotionPages() {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Status',
      status: { equals: 'Done' }
    }
  });
  return response.results;
}

function extractTextFromRichText(richText) {
  return richText.map(text => {
    let content = text.plain_text;
    
    // Aplicar formato de texto
    if (text.annotations.bold) content = `**${content}**`;
    if (text.annotations.italic) content = `*${content}*`;
    if (text.annotations.code) content = `\`${content}\``;
    if (text.annotations.strikethrough) content = `~~${content}~~`;
    
    // Agregar enlaces
    if (text.href) content = `[${content}](${text.href})`;
    
    return content;
  }).join('');
}

async function getPageContent(pageId) {
  const blocks = await notion.blocks.children.list({ 
    block_id: pageId,
    page_size: 100
  });
  
  let content = '';
  
  for (const block of blocks.results) {
    try {
      switch (block.type) {
        case 'paragraph':
          if (block.paragraph.rich_text.length > 0) {
            content += extractTextFromRichText(block.paragraph.rich_text) + '\n\n';
          } else {
            content += '\n'; // Párrafo vacío
          }
          break;
          
        case 'heading_1':
          if (block.heading_1.rich_text.length > 0) {
            content += '# ' + extractTextFromRichText(block.heading_1.rich_text) + '\n\n';
          }
          break;
          
        case 'heading_2':
          if (block.heading_2.rich_text.length > 0) {
            content += '## ' + extractTextFromRichText(block.heading_2.rich_text) + '\n\n';
          }
          break;
          
        case 'heading_3':
          if (block.heading_3.rich_text.length > 0) {
            content += '### ' + extractTextFromRichText(block.heading_3.rich_text) + '\n\n';
          }
          break;
          
        case 'bulleted_list_item':
          if (block.bulleted_list_item.rich_text.length > 0) {
            content += '- ' + extractTextFromRichText(block.bulleted_list_item.rich_text) + '\n';
          }
          break;
          
        case 'numbered_list_item':
          if (block.numbered_list_item.rich_text.length > 0) {
            content += '1. ' + extractTextFromRichText(block.numbered_list_item.rich_text) + '\n';
          }
          break;
          
        case 'code':
          const language = block.code.language || '';
          const codeText = extractTextFromRichText(block.code.rich_text);
          content += `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;
          break;
          
        case 'quote':
          if (block.quote.rich_text.length > 0) {
            content += '> ' + extractTextFromRichText(block.quote.rich_text) + '\n\n';
          }
          break;
          
        case 'callout':
          if (block.callout.rich_text.length > 0) {
            const emoji = block.callout.icon?.emoji || '💡';
            content += `${emoji} **${extractTextFromRichText(block.callout.rich_text)}**\n\n`;
          }
          break;
          
        case 'divider':
          content += '---\n\n';
          break;
          
        case 'image':
          let imageUrl = '';
          if (block.image.type === 'external') {
            imageUrl = block.image.external.url;
          } else if (block.image.type === 'file') {
            imageUrl = block.image.file.url;
          }
          
          if (imageUrl) {
            const caption = block.image.caption.length > 0 
              ? extractTextFromRichText(block.image.caption) 
              : '';
            content += `![${caption}](${imageUrl})\n`;
            if (caption) content += `*${caption}*\n`;
            content += '\n';
          }
          break;
          
        case 'video':
          let videoUrl = '';
          if (block.video.type === 'external') {
            videoUrl = block.video.external.url;
          } else if (block.video.type === 'file') {
            videoUrl = block.video.file.url;
          }
          
          if (videoUrl) {
            // Para videos de YouTube, Vimeo, etc.
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
              content += `{% youtube ${videoUrl} %}\n\n`;
            } else if (videoUrl.includes('vimeo.com')) {
              content += `{% vimeo ${videoUrl} %}\n\n`;
            } else {
              content += `[🎥 Video](${videoUrl})\n\n`;
            }
          }
          break;
          
        case 'embed':
          if (block.embed.url) {
            const embedUrl = block.embed.url;
            
            // Detectar tipo de embed
            if (embedUrl.includes('twitter.com') || embedUrl.includes('x.com')) {
              content += `{% twitter ${embedUrl} %}\n\n`;
            } else if (embedUrl.includes('codepen.io')) {
              content += `{% codepen ${embedUrl} %}\n\n`;
            } else if (embedUrl.includes('github.com')) {
              content += `{% github ${embedUrl} %}\n\n`;
            } else {
              content += `[🔗 ${embedUrl}](${embedUrl})\n\n`;
            }
          }
          break;
          
        case 'bookmark':
          if (block.bookmark.url) {
            const caption = block.bookmark.caption.length > 0 
              ? extractTextFromRichText(block.bookmark.caption)
              : 'Link';
            content += `[${caption}](${block.bookmark.url})\n\n`;
          }
          break;
          
        case 'link_preview':
          if (block.link_preview.url) {
            content += `[${block.link_preview.url}](${block.link_preview.url})\n\n`;
          }
          break;
          
        case 'link_to_page':
          // Omitir enlaces a páginas internas de Notion
          console.log(`⚠️  Enlace a página interna omitido`);
          break;
          
        case 'file':
          if (block.file) {
            let fileUrl = '';
            if (block.file.type === 'external') {
              fileUrl = block.file.external.url;
            } else if (block.file.type === 'file') {
              fileUrl = block.file.file.url;
            }
            
            if (fileUrl) {
              const fileName = block.file.name || 'Archivo';
              content += `[📎 ${fileName}](${fileUrl})\n\n`;
            }
          }
          break;
          
        case 'table':
          // Las tablas requieren procesamiento adicional de filas
          content += '| | |\n|---|---|\n'; // Tabla básica
          break;
          
        default:
          // Para tipos no soportados, intentar extraer texto si existe
          if (block[block.type]?.rich_text) {
            content += extractTextFromRichText(block[block.type].rich_text) + '\n\n';
          }
          console.log(`⚠️  Tipo de bloque no soportado: ${block.type}`);
      }
    } catch (error) {
      console.log(`⚠️  Error procesando bloque ${block.type}, omitiendo: ${error.message}`);
      // Continúa con el siguiente bloque
    }
  }
  
  return content.trim();
}

function extractArticleIdFromUrl(devtoUrl) {
  // Extraer ID del artículo de la URL de Dev.to
  // Ejemplo: https://dev.to/username/title-123 -> 123
  const match = devtoUrl.match(/\/([^\/]+)-(\d+)$/);
  return match ? match[2] : null;
}

async function publishToDevTo(title, content, tags = []) {
  // Validar que el título no esté vacío
  if (!title || title.trim() === '' || title === 'Untitled') {
    throw new Error('El título del artículo no puede estar vacío');
  }

  // Validar que el contenido no esté vacío
  if (!content || content.trim() === '') {
    throw new Error('El contenido del artículo no puede estar vacío');
  }

  const article = {
    article: {
      title: title.trim(),
      body_markdown: content.trim(),
      published: false,
      tags: tags || []
    }
  };

  try {
    // Agregar delay para evitar rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.post('https://dev.to/api/articles', article, {
      headers: {
        'api-key': devtoApiKey,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⏳ Rate limit alcanzado, esperando 30 segundos...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      // Reintentar una vez
      const response = await axios.post('https://dev.to/api/articles', article, {
        headers: {
          'api-key': devtoApiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    }
    
    console.error('❌ Error detallado de Dev.to:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      article: article
    });
    throw error;
  }
}

async function updateDevToArticle(articleId, title, content, tags = []) {
  const article = {
    article: {
      title,
      body_markdown: content,
      tags
    }
  };

  const response = await axios.put(`https://dev.to/api/articles/${articleId}`, article, {
    headers: {
      'api-key': devtoApiKey,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

async function updateNotionStatus(pageId, devtoUrl) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'Status': { status: { name: 'Published' } },
      'URL': { url: devtoUrl }
    }
  });
}

async function main() {
  try {
    console.log('🔍 Buscando páginas con status "Done"...');
    const pages = await getNotionPages();
    
    if (pages.length === 0) {
      console.log('ℹ️  No se encontraron páginas para publicar');
      return;
    }

    console.log(`📝 Encontradas ${pages.length} páginas para publicar`);
    
    for (const page of pages) {
      // Extraer título de la propiedad Name
      let title = 'Untitled';
      
      if (page.properties.Name) {
        const nameProp = page.properties.Name;
        if (nameProp.title && nameProp.title.length > 0) {
          title = nameProp.title.map(t => t.plain_text).join('').trim();
        } else if (nameProp.rich_text && nameProp.rich_text.length > 0) {
          title = nameProp.rich_text.map(t => t.plain_text).join('').trim();
        } else if (nameProp.plain_text) {
          title = nameProp.plain_text.trim();
        }
      }
      
      const existingUrl = page.properties.URL?.url;
      
      console.log(`📤 Procesando: ${title}`);
      
      const content = await getPageContent(page.id);
      
      let devtoArticle;
      
      if (existingUrl) {
        // Actualizar artículo existente
        const articleId = extractArticleIdFromUrl(existingUrl);
        if (articleId) {
          try {
            console.log(`🔄 Actualizando artículo existente: ${title}`);
            devtoArticle = await updateDevToArticle(articleId, title, content, []);
            console.log(`✅ Actualizado: ${title} -> ${existingUrl}`);
          } catch (error) {
            if (error.response?.status === 404) {
              console.log(`⚠️  Artículo no encontrado en Dev.to, creando nuevo: ${title}`);
              devtoArticle = await publishToDevTo(title, content, []);
              console.log(`✅ Publicado (nuevo): ${title} -> ${devtoArticle.url}`);
            } else {
              throw error;
            }
          }
        } else {
          console.log(`⚠️  No se pudo extraer ID del artículo, creando nuevo: ${title}`);
          devtoArticle = await publishToDevTo(title, content, []);
          console.log(`✅ Publicado (nuevo): ${title} -> ${devtoArticle.url}`);
        }
      } else {
        // Crear nuevo artículo
        console.log(`📝 Creando nuevo artículo: ${title}`);
        devtoArticle = await publishToDevTo(title, content, []);
        console.log(`✅ Publicado: ${title} -> ${devtoArticle.url}`);
      }
      
      await updateNotionStatus(page.id, devtoArticle.url);
    }
    
    console.log(`🎉 Proceso completado. ${pages.length} artículos procesados`);
  } catch (error) {
    console.error('❌ Error durante la publicación:', error.message);
    process.exit(1);
  }
}

main();
