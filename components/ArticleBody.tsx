type ArticleBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; alt: string; src: string };

function blockClass(block: ArticleBlock, index: number) {
  if (block.type === 'heading') {
    const text = block.text.toLowerCase();
    if (text.includes('checklist') || text.includes('conclusion') || text.includes('wnios') || text.includes('podsum') || text.includes('вывод') || text.includes('итог')) {
      return 'article-body__wide';
    }
    return 'article-body__heading';
  }
  if (block.type === 'list') return 'article-body__list article-body__wide';
  if (index === 0) return 'article-body__lead article-body__wide';
  return undefined;
}

function parseListItem(item: string) {
  const clean = item.replace(/\*\*/g, '').trim();
  const [rawTitle, ...rest] = clean.split(':');
  if (rest.length === 0) return { title: clean, body: '' };
  return {
    title: rawTitle.trim(),
    body: rest.join(':').trim(),
  };
}

export function ArticleBody({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ArticleBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', text });
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: 'list', items: listItems });
    listItems = [];
  };

  lines.forEach((line) => {
    const text = line.trim();
    if (!text) {
      flushParagraph();
      flushList();
      return;
    }

    const imageMatch = text.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/);
    if (imageMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'image', alt: imageMatch[1], src: imageMatch[2] });
      return;
    }

    if (text.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: text.slice(3).trim() });
      return;
    }

    if (text.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: text.slice(2).trim() });
      return;
    }

    if (/^[-*]\s+/.test(text)) {
      flushParagraph();
      listItems.push(text.replace(/^[-*]\s+/, '').trim());
      return;
    }

    flushList();
    paragraph.push(text);
  });

  flushParagraph();
  flushList();

  return (
    <div className="article-body">
      {blocks.map((block, index) => {
        const className = blockClass(block, index);
        if (block.type === 'image') {
          return <img className="article-body__image article-body__wide" src={block.src} alt={block.alt} key={index} loading="lazy" />;
        }
        if (block.type === 'heading') return <h2 className={className} key={index}>{block.text}</h2>;
        if (block.type === 'list') {
          return (
            <ol className={className} key={index}>
              {block.items.map((item) => {
                const parsed = parseListItem(item);
                return (
                  <li key={item}>
                    <strong>{parsed.title}</strong>
                    {parsed.body && <span>{parsed.body}</span>}
                  </li>
                );
              })}
            </ol>
          );
        }
        return <p className={className} key={index}>{block.text.replace(/\*\*/g, '')}</p>;
      })}
    </div>
  );
}
