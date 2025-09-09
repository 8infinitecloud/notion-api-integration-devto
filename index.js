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
      status: { equals: 'Published' }
    }
  });
  return response.results;
}

async function getPageContent(pageId) {
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  let content = '';
  
  for (const block of blocks.results) {
    if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
      content += block.paragraph.rich_text.map(text => text.plain_text).join('') + '\n\n';
    } else if (block.type === 'heading_1' && block.heading_1.rich_text.length > 0) {
      content += '# ' + block.heading_1.rich_text.map(text => text.plain_text).join('') + '\n\n';
    } else if (block.type === 'heading_2' && block.heading_2.rich_text.length > 0) {
      content += '## ' + block.heading_2.rich_text.map(text => text.plain_text).join('') + '\n\n';
    }
  }
  
  return content;
}

async function publishToDevTo(title, content, tags = []) {
  const article = {
    article: {
      title,
      body_markdown: content,
      published: false,
      tags
    }
  };

  const response = await axios.post('https://dev.to/api/articles', article, {
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
      'Status': { status: { name: 'Posted' } }
    }
  });
}

async function main() {
  try {
    console.log('🔍 Buscando páginas con status "Published"...');
    const pages = await getNotionPages();
    
    if (pages.length === 0) {
      console.log('ℹ️  No se encontraron páginas para publicar');
      return;
    }

    console.log(`📝 Encontradas ${pages.length} páginas para publicar`);
    
    for (const page of pages) {
      const title = page.properties.Title?.title?.[0]?.plain_text || 'Untitled';
      
      console.log(`📤 Publicando: ${title}`);
      
      const content = await getPageContent(page.id);
      const devtoArticle = await publishToDevTo(title, content, []);
      
      await updateNotionStatus(page.id, devtoArticle.url);
      
      console.log(`✅ Publicado: ${title} -> ${devtoArticle.url}`);
    }
    
    console.log(`🎉 Proceso completado. ${pages.length} artículos publicados`);
  } catch (error) {
    console.error('❌ Error durante la publicación:', error.message);
    process.exit(1);
  }
}

main();
