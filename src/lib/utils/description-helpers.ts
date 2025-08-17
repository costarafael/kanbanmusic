// Utility to extract plain text from rich text description object
export function extractPlainText(description: any): string {
  if (!description) return '';
  
  // Check if it's already a string
  if (typeof description === 'string') {
    return description;
  }
  
  // Handle array of blocks/nodes directly
  if (Array.isArray(description)) {
    return description
      .map((item: any) => extractPlainText(item))
      .filter(Boolean)
      .join('\n');
  }
  
  // Handle rich text editor format with id, type, children
  if (description.type && description.children) {
    if (description.type === 'paragraph') {
      return extractPlainText(description.children);
    }
    return extractPlainText(description.children);
  }
  
  // Check if it has blocks (typical structure from rich text editors like EditorJS)
  if (description.blocks && Array.isArray(description.blocks)) {
    return description.blocks
      .map((block: any) => {
        if (block.type === 'paragraph' && block.data && block.data.text) {
          return block.data.text;
        }
        if (block.data && typeof block.data.text === 'string') {
          return block.data.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  
  // Check if it has children array (Slate.js and similar editors)
  if (description.children && Array.isArray(description.children)) {
    return description.children
      .map((child: any) => {
        if (typeof child === 'string') return child;
        if (child.text && typeof child.text === 'string') return child.text;
        if (child.children) return extractPlainText(child.children);
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
  
  // Try to extract any text property directly
  if (description.text && typeof description.text === 'string') {
    return description.text;
  }
  
  // Handle ProseMirror/TipTap format with content array
  if (description.content && Array.isArray(description.content)) {
    return description.content
      .map((node: any) => extractPlainText(node))
      .filter(Boolean)
      .join(' ');
  }
  
  // Handle simple object with text values - recursively extract text
  if (typeof description === 'object') {
    const textValues: string[] = [];
    
    function extractTextFromObject(obj: any): void {
      if (typeof obj === 'string') {
        // Only add meaningful text, not property names or IDs
        if (obj.length > 2 && !obj.match(/^(id|type|paragraph|heading|text|children|content)(-\d+)?$/)) {
          textValues.push(obj);
        }
        return;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(extractTextFromObject);
        return;
      }
      
      if (obj && typeof obj === 'object') {
        // Skip metadata properties, focus on content
        Object.entries(obj).forEach(([key, value]) => {
          if (!key.match(/^(id|type|paragraph|heading|meta|props|attributes)$/)) {
            extractTextFromObject(value);
          }
        });
      }
    }
    
    extractTextFromObject(description);
    return textValues.join(' ').trim();
  }
  
  return '';
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function truncateToLines(text: string, maxLines: number = 6): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  
  return lines.slice(0, maxLines).join('\n');
}