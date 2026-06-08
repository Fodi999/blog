export function ArticleBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="article-body">
      {blocks.map((block, index) => {
        const text = block.trim();
        if (text.startsWith('## ')) return <h2 key={index}>{text.slice(3)}</h2>;
        if (text.startsWith('# ')) return <h2 key={index}>{text.slice(2)}</h2>;
        if (text.startsWith('- ') || text.startsWith('* ')) {
          const items = text.split('\n').map((item) => item.replace(/^[-*]\s+/, ''));
          return <ul key={index}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
        }
        return <p key={index}>{text.replace(/\*\*/g, '')}</p>;
      })}
    </div>
  );
}
