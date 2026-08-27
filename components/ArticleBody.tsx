type ArticleBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; alt: string; src: string };

function isWideHeading(text: string) {
  const lower = text.toLowerCase();
  return lower.includes('checklist') || lower.includes('conclusion') || lower.includes('wnios') || lower.includes('podsum') || lower.includes('вывод') || lower.includes('итог');
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

const headingWideClass = 'col-span-full min-w-0 animate-reveal mt-16 max-w-[26ch] font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] font-medium';
const headingDefaultClass = 'min-w-0 animate-reveal mt-12 mb-1 font-display text-[clamp(26px,3.2vw,40px)] leading-[1.1] font-medium max-[900px]:mt-9';

export function ArticleBody({ content, dark = false }: { content: string; dark?: boolean }) {
  const textClass = dark ? 'text-on-ink' : 'text-on-bone';
  const textMutedClass = dark ? 'text-on-ink-muted' : 'text-on-bone-muted';
  const hairlineClass = dark ? 'border-hairline-ink' : 'border-hairline-bone';
  const strongLineClass = dark ? 'border-on-ink' : 'border-on-bone';
  const leadClass = `col-span-full min-w-0 animate-reveal max-w-[62ch] text-[clamp(19px,2vw,24px)] leading-[1.55] ${textClass}`;
  const paragraphClass = `min-w-0 animate-reveal text-[17px] leading-[1.75] ${textClass}`;
  const headingFollowupClass = `min-w-0 animate-reveal mt-1 text-[17px] leading-[1.75] ${textClass}`;
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
    <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-[clamp(42px,6vw,90px)] gap-y-5 pt-2 max-[900px]:grid-cols-1">
      {blocks.map((block, index) => {
        if (block.type === 'image') {
          return (
            <img
              className={`col-span-full min-w-0 animate-reveal my-14 mx-auto h-auto w-[min(100%,960px)] border bg-white object-contain object-center ${hairlineClass}`}
              src={block.src}
              alt={block.alt}
              key={index}
              loading="lazy"
            />
          );
        }
        if (block.type === 'heading') {
          const wide = isWideHeading(block.text);
          return (
            <h2 className={wide ? headingWideClass : headingDefaultClass} key={index}>
              {block.text}
            </h2>
          );
        }
        if (block.type === 'list') {
          return (
            <ol
              className={`col-span-full min-w-0 animate-reveal mt-6 mb-14 grid grid-cols-2 gap-x-[clamp(42px,6vw,88px)] gap-y-0 border-t-2 border-b pt-8 pb-9 max-[900px]:grid-cols-1 max-[580px]:pt-5 max-[580px]:pb-5 ${strongLineClass} ${hairlineClass}`}
              key={index}
            >
              {block.items.map((item, itemIndex) => {
                const parsed = parseListItem(item);
                return (
                  <li
                    key={item}
                    className={`relative grid grid-cols-[auto_1fr] gap-x-[18px] gap-y-3 border-b py-6 font-normal ${dark ? 'border-on-ink/10' : 'border-on-bone/10'}`}
                  >
                    <span aria-hidden className="font-display text-2xl leading-none text-gold">
                      {String(itemIndex + 1).padStart(2, '0')}
                    </span>
                    <strong className="col-start-2 self-end font-display text-xl leading-[1.05] font-medium">
                      {parsed.title}
                    </strong>
                    {parsed.body && <span className={`col-start-2 max-w-[360px] text-base leading-[1.5] ${textMutedClass}`}>{parsed.body}</span>}
                  </li>
                );
              })}
            </ol>
          );
        }
        const prevBlock = blocks[index - 1];
        const isLead = index === 0;
        const followsHeading = prevBlock?.type === 'heading' && !isWideHeading(prevBlock.text);
        return (
          <p
            className={isLead ? leadClass : followsHeading ? headingFollowupClass : paragraphClass}
            key={index}
          >
            {block.text.replace(/\*\*/g, '')}
          </p>
        );
      })}
    </div>
  );
}
