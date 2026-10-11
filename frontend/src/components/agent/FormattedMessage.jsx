import React from 'react';

/**
 * Formats inline elements:
 * - Clean math/chemistry symbols (ET₀, CO₂, Kc, H₂O)
 * - `inline code` -> styled mono badge
 * - **bold** -> bright amber bold
 * - *italic* -> styled italic
 */
export const formatInline = (text) => {
  if (!text) return null;

  // Replace raw LaTeX-style formulas with clean unicode notation
  const cleaned = text
    .replace(/\$ET_0\$|\$ET_\{0\}\$/g, 'ET₀')
    .replace(/\$CO_2\$|\$CO_\{2\}\$/g, 'CO₂')
    .replace(/\$K_c\$|\$K_\{c\}\$/g, 'Kc')
    .replace(/\$H_2O\$/g, 'H₂O')
    .replace(/\$([A-Za-z0-9_+\-.]+)\$/g, '$1');

  const tokens = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(cleaned.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-stone-950 text-emerald-300 border border-emerald-800/60 font-mono text-[11px] shadow-sm inline-block"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={`b-${match.index}`} className="font-bold text-amber-200">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={`i-${match.index}`} className="italic text-amber-100/90">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < cleaned.length) {
    tokens.push(cleaned.slice(lastIdx));
  }

  return tokens.length > 0 ? tokens : cleaned;
};

/**
 * Rich Formatted Message Component
 * Parses raw AI Markdown output (headers, tables, lists, code, bold, math)
 * and renders it as clean, beautifully styled UI elements.
 */
export const FormattedMessage = ({ content }) => {
  if (!content) return null;

  const rawLines = content.split('\n');
  const blocks = [];
  let currentTable = null;
  let currentList = null;

  const flushTable = () => {
    if (currentTable) {
      blocks.push({ type: 'table', data: currentTable });
      currentTable = null;
    }
  };

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Table row detection (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      if (!currentTable) {
        currentTable = { headers: [], rows: [] };
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        currentTable.headers = cells;
      } else {
        // Skip separator row (|---|---|)
        const isSeparator = trimmed
          .split('')
          .every((char) => char === '|' || char === '-' || char === ':' || char === ' ');
        if (isSeparator && trimmed.includes('-')) {
          continue;
        }
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        currentTable.rows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // 2. Ordered list item (1. item)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({ num: orderedMatch[1], text: orderedMatch[2] });
      continue;
    }

    // 3. Unordered list item (- item, * item, • item)
    const unorderedMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (unorderedMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push({ text: unorderedMatch[1] });
      continue;
    }

    // Not in a list
    flushList();

    if (!trimmed) {
      // Empty line / paragraph gap
      continue;
    }

    // 4. Headings
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3) });
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2) });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'quote', text: trimmed.slice(2) });
    } else {
      blocks.push({ type: 'p', text: line });
    }
  }

  flushTable();
  flushList();

  return (
    <div className="space-y-2 text-stone-200 leading-relaxed text-xs">
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <h2 key={idx} className="text-base font-extrabold text-amber-200 mt-2 mb-1">
              {formatInline(block.text)}
            </h2>
          );
        }
        if (block.type === 'h2') {
          return (
            <h3 key={idx} className="text-sm font-bold text-amber-300 mt-2 mb-1">
              {formatInline(block.text)}
            </h3>
          );
        }
        if (block.type === 'h3') {
          return (
            <h4
              key={idx}
              className="text-xs font-bold text-amber-300 pt-1 pb-1 border-b border-amber-900/50 flex items-center space-x-1.5"
            >
              <span>{formatInline(block.text)}</span>
            </h4>
          );
        }
        if (block.type === 'table') {
          return (
            <div
              key={idx}
              className="my-2.5 overflow-x-auto rounded-xl border border-amber-900/60 bg-stone-950/80 shadow-md"
            >
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-stone-900/90 border-b border-amber-900/70 text-amber-300 font-semibold">
                    {block.data.headers.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2">
                        {formatInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {block.data.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-stone-900/30'}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 text-stone-200">
                          {formatInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="space-y-1 my-1.5 pl-1">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start space-x-2 text-stone-200">
                  <span className="text-emerald-400 mt-1 flex-shrink-0 text-[10px]">●</span>
                  <div className="flex-1">{formatInline(item.text)}</div>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={idx} className="space-y-1.5 my-1.5 pl-1">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start space-x-2 text-stone-200">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 text-[9px] font-mono font-bold flex-shrink-0 mt-0.5 shadow-sm">
                    {item.num}
                  </span>
                  <div className="flex-1">{formatInline(item.text)}</div>
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === 'quote') {
          return (
            <div
              key={idx}
              className="my-2 p-2.5 rounded-lg bg-amber-950/40 border-l-2 border-amber-500 text-amber-200/90 italic"
            >
              {formatInline(block.text)}
            </div>
          );
        }
        return (
          <p key={idx} className="my-1 text-stone-200 leading-relaxed">
            {formatInline(block.text)}
          </p>
        );
      })}
    </div>
  );
};
