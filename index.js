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
      select: { equals: 'Ready to Publish' }
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
      'Status': { select: { name: 'Published' } },
      'Dev.to URL': { url: devtoUrl }
    }
  });
}

async function main() {
  try {
    const pages = await getNotionPages();
    
    for (const page of pages) {
      const title = page.properties.Title?.title?.[0]?.plain_text || 'Untitled';
      const tags = page.properties.Tags?.multi_select?.map(tag => tag.name) || [];
      
      const content = await getPageContent(page.id);
      const devtoArticle = await publishToDevTo(title, content, tags);
      
      await updateNotionStatus(page.id, devtoArticle.url);
      
      console.log(`Published: ${title} -> ${devtoArticle.url}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
