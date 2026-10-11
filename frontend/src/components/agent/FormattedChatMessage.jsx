import React from 'react';
import { 
  ChevronRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Droplets, 
  Sun, 
  CloudRain,
  Flame,
  Scale
} from 'lucide-react';

/**
 * Parses inline formatting:
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - `code` -> <code>
 * - $ET_0$ / $CO_2$ -> clean subscript / formatted string
 */
function renderInlineContent(text) {
  if (!text) return null;

  // Clean common math variables like $ET_0$, $CO_2$, $K_c$
  let cleaned = text
    .replace(/\$ET_0\$/g, 'ET₀')
    .replace(/\$ET0\$/g, 'ET₀')
    .replace(/\$CO_2\$/g, 'CO₂')
    .replace(/\$K_c\$/g, 'Kc');

  // Tokenize bold, italic, code
  // Regex to match **bold**, *italic*, `code`
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = cleaned.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-amber-200">
          {inner}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-emerald-300">
          {inner}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <code key={index} className="px-1.5 py-0.5 mx-0.5 rounded bg-stone-950 border border-stone-800 text-amber-300 font-mono text-[11px]">
          {inner}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

/**
 * High-aesthetic chat renderer that converts markdown into clean,
 * styled UI elements without raw asterisks, hashes, or messy symbols.
 */
export const FormattedChatMessage = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let tableRows = [];
  let inTable = false;

  const flushTable = (keyPrefix) => {
    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const rows = tableRows.slice(1).filter((r) => !r.isDivider);

      elements.push(
        <div key={`${keyPrefix}-table`} className="my-2.5 overflow-x-auto rounded-lg border border-amber-900/60 bg-stone-950 shadow-md">
          <table className="w-full text-[11px] text-left text-stone-300">
            {headers && (
              <thead className="bg-stone-900/90 text-amber-300 font-mono font-bold uppercase border-b border-amber-900/60">
                <tr>
                  {headers.cells.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3 py-2">
                      {renderInlineContent(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-stone-850">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-stone-900/40 transition-colors">
                  {row.cells.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5">
                      {renderInlineContent(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    // Table row detection (| col 1 | col 2 |)
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      const isDivider = line.includes('---');
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      tableRows.push({ cells, isDivider });
      return;
    } else if (inTable) {
      flushTable(index);
    }

    // Empty blank lines
    if (!line) {
      elements.push(<div key={`blank-${index}`} className="h-2" />);
      return;
    }

    // Headings: ### or ## or #
    if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
      const headingText = line.replace(/^#{1,4}\s+/, '');
      elements.push(
        <div key={`heading-${index}`} className="pt-2 pb-1 flex items-center space-x-2 border-b border-amber-900/40">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <h4 className="text-xs font-extrabold text-amber-200 tracking-wide font-sans">
            {renderInlineContent(headingText)}
          </h4>
        </div>
      );
      return;
    }

    // Bold section titles without bullets: e.g. **Soil Hydrodynamics:**
    if (line.startsWith('**') && (line.endsWith(':**') || line.endsWith('**')) && !line.includes('-')) {
      const title = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/:$/, '');
      elements.push(
        <div key={`section-title-${index}`} className="pt-2 text-[11px] font-bold text-amber-300 flex items-center space-x-1.5">
          <ChevronRight className="w-3 h-3 text-amber-400" />
          <span>{title}</span>
        </div>
      );
      return;
    }

    // Bullet points: - or *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletContent = line.slice(2).trim();
      elements.push(
        <div key={`bullet-${index}`} className="flex items-start space-x-2 text-[11px] text-stone-200 pl-1 leading-relaxed">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
          <div className="flex-1">
            {renderInlineContent(bulletContent)}
          </div>
        </div>
      );
      return;
    }

    // Numbered points: 1. 2. 3.
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const text = numberedMatch[2];
      elements.push(
        <div key={`numbered-${index}`} className="flex items-start space-x-2 text-[11px] text-stone-200 pl-1 leading-relaxed">
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 text-amber-300 flex-shrink-0 mt-0.5">
            {num}
          </span>
          <div className="flex-1">
            {renderInlineContent(text)}
          </div>
        </div>
      );
      return;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${index}`} className="text-[11px] text-stone-200 leading-relaxed">
        {renderInlineContent(line)}
      </p>
    );
  });

  if (inTable) {
    flushTable('end');
  }

  return <div className="space-y-1">{elements}</div>;
};
