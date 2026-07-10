const PAIRS: { raw: string; clean: string; y: number }[] = [
  { raw: "Contact Email", clean: "email", y: 32 },
  { raw: "phone_no.", clean: "mobile_without_country_code", y: 74 },
  { raw: "Full  Name", clean: "name", y: 116 },
  { raw: "LEAD_SRC", clean: "data_source", y: 158 },
  { raw: "notes / remarks", clean: "crm_note", y: 200 },
];

const LEFT_X = 16;
const LEFT_W = 150;
const RIGHT_X = 430;
const RIGHT_W = 220;
const VIEW_W = 666;
const VIEW_H = 232;

export function MappingVisual() {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto"
      role="img"
      aria-label="Diagram showing raw CSV column headers being matched to clean CRM fields"
    >
      {PAIRS.map((pair, i) => {
        const startX = LEFT_X + LEFT_W;
        const endX = RIGHT_X;
        const midX = (startX + endX) / 2;
        return (
          <path
            key={i}
            d={`M ${startX} ${pair.y} C ${midX} ${pair.y}, ${midX} ${pair.y}, ${endX} ${pair.y}`}
            fill="none"
            stroke="var(--color-accent-line)"
            strokeWidth="1.5"
            className="mapping-line"
          />
        );
      })}

      {PAIRS.map((pair, i) => (
        <g key={`raw-${i}`}>
          <rect
            x={LEFT_X}
            y={pair.y - 14}
            width={LEFT_W}
            height={28}
            rx={6}
            fill="var(--color-surface)"
            stroke="var(--color-border-strong)"
            strokeDasharray="3 3"
          />
          <text
            x={LEFT_X + LEFT_W / 2}
            y={pair.y + 4}
            textAnchor="middle"
            className="fill-ink-muted"
            fontFamily="var(--font-mono)"
            fontSize="11"
          >
            {pair.raw}
          </text>
        </g>
      ))}

      {PAIRS.map((pair, i) => (
        <g key={`clean-${i}`}>
          <rect
            x={RIGHT_X}
            y={pair.y - 14}
            width={RIGHT_W}
            height={28}
            rx={14}
            fill="var(--color-accent-soft)"
          />
          <circle cx={RIGHT_X + 16} cy={pair.y} r={3} fill="var(--color-accent)" />
          <text
            x={RIGHT_X + 28}
            y={pair.y + 4}
            className="fill-accent-ink"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fontWeight={500}
          >
            {pair.clean}
          </text>
        </g>
      ))}
    </svg>
  );
}
