export interface ParsedSection {
  key: string;
  heading: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
}

export function parseHeadings(content: string): ParsedSection[] {
  const normalized = content.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const sections: ParsedSection[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(headingRegex);
    if (match) {
      const level = match[1].length;
      const heading = match[2].trim();
      const key = heading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 60);
      
      sections.push({
        key,
        heading,
        level,
        content: '',
        startLine: i,
        endLine: i,
      });
    }
  }
  
  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].startLine + 1;
    const end = i + 1 < sections.length ? sections[i + 1].startLine : lines.length;
    sections[i].endLine = end - 1;
    sections[i].content = lines.slice(start, end).join('\n').trim();
  }
  
  return sections;
}

export function buildHeadingCriteria(sections: ParsedSection[]): Record<string, string> {
  const criteria: Record<string, string> = {};
  const usedKeys = new Set<string>();
  for (const section of sections) {
    let key = section.key;
    if (usedKeys.has(key)) {
      key = `${key}_L${section.startLine}`;
    }
    usedKeys.add(key);
    criteria[key] = `${'#'.repeat(section.level)} ${section.heading}`;
  }
  return criteria;
}

export function extractSection(sections: ParsedSection[], sectionKey: string): { excerpt: string; heading: string } {
  const section = sections.find(s => s.key === sectionKey || s.key.startsWith(sectionKey));
  if (!section) {
    const allContent = sections.map(s => s.content).join('\n');
    return {
      excerpt: allContent.substring(0, 4000),
      heading: sections[0]?.heading || 'Document',
    };
  }
  
  let excerpt = section.content;
  if (excerpt.length > 4000) {
    excerpt = excerpt.substring(0, 4000) + '\n[...truncated]';
  }
  
  if (excerpt.length < 500) {
    const idx = sections.indexOf(section);
    if (idx + 1 < sections.length) {
      excerpt += '\n\n' + sections[idx + 1].content;
    }
    if (excerpt.length > 4000) {
      excerpt = excerpt.substring(0, 4000) + '\n[...truncated]';
    }
  }
  
  return {
    excerpt,
    heading: section.heading,
  };
}
