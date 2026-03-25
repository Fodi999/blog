import { FC } from 'react';

interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

/**
 * Serialize JSON-LD safely:
 * - Использует JSON.stringify() — никогда не собираем строку руками
 * - Экранируем </script> чтобы не сломать HTML-парсер
 * - НЕ экранируем & → &amp; (это делает React в атрибутах, но не в dangerouslySetInnerHTML)
 */
function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');
}

export const JsonLd: FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
};
