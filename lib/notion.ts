import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
  console.error('Notion API key or Database ID is missing. Please check your .env.local file.');
}

let notion: Client | null = null;
let n2m: NotionToMarkdown | null = null;

if (notionApiKey && notionDatabaseId) {
  notion = new Client({ auth: notionApiKey });
  n2m = new NotionToMarkdown({ notionClient: notion });
} else {
  console.warn('Notion client not initialized due to missing API key or Database ID');
}

async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw lastError;
}

export async function getPosts() {
  if (!notion || !notionDatabaseId) {
    console.error('Notion client or Database ID not configured');
    return [];
  }

  try {
    const response = await retryOperation(() => notion!.databases.query({
      database_id: notionDatabaseId!,
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    }));

    return response.results.map((page: any) => {
      return {
        id: page.id,
        title: page.properties.Name.title[0]?.plain_text || 'Untitled',
        slug: page.properties.Slug.rich_text[0]?.plain_text || 'no-slug',
        excerpt: page.properties.Excerpt.rich_text[0]?.plain_text || 'No excerpt available',
      };
    });
  } catch (error) {
    console.error('Error fetching posts from Notion:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  if (!notion || !notionDatabaseId || !n2m) {
    console.error('Notion client, Database ID, or NotionToMarkdown not configured');
    return null;
  }

  try {
    const response = await retryOperation(() => notion!.databases.query({
      database_id: notionDatabaseId!,
      filter: {
        property: 'Slug',
        rich_text: {
          equals: slug,
        },
      },
    }));

    if (!response.results.length) {
      console.warn(`No post found with slug: ${slug}`);
      return null;
    }

    const page = response.results[0];
    const mdblocks = await retryOperation(() => n2m!.pageToMarkdown(page.id));
    const mdString = n2m!.toMarkdownString(mdblocks);

    return {
      id: page.id,
      title: page.properties.Name.title[0]?.plain_text || 'Untitled',
      content: mdString,
    };
  } catch (error) {
    console.error('Error fetching post from Notion:', error);
    return null;
  }
}