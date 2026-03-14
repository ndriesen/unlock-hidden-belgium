import fs from 'fs/promises';
import path from 'path';

export type LegalDoc = {
  slug: string;
  title: string;
  lastUpdated: string;
  content: string;
};

export async function getLegalDocuments(): Promise<LegalDoc[]> {
  const legalDir = path.join(process.cwd(), 'legal');
  
  try {
    const files = await fs.readdir(legalDir);
    const mdFiles = files.filter((f) => f.endsWith('.md') && !f.startsWith('.'));

    const docs = await Promise.all(
      mdFiles.map(async (file) => {
        const fullPath = path.join(legalDir, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Extract title from first H1 line
        const titleMatch = content.match(/^#\s+(.*)$/m);
        const title = titleMatch 
          ? titleMatch[1].trim() 
          : file.replace(/[-_]/g, ' ').replace(/\.md$/, '').toUpperCase();
        
        const slug = file.slice(0, -3);
        
        // Replace [DATE] placeholder
        const lastUpdated = new Date().toLocaleDateString('en-GB');
        const processedContent = content.replace(/\[DATE\]/g, lastUpdated);
        
        // File mtime for real last updated
        const stat = await fs.stat(fullPath);
        const fileLastUpdated = stat.mtime.toLocaleDateString('en-GB');
        
        return {
          slug,
          title,
          content: processedContent,
          lastUpdated: fileLastUpdated,
        };
      })
    );
    
    return docs.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error('Error loading legal documents:', error);
    return [];
  }
}

