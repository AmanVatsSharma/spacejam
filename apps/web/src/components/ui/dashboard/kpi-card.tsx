/**
 * File:        apps/web/src/components/ui/dashboard/kpi-card.tsx
 * Module:      Web · Dashboard · KPICard
 * Purpose:     KPI card with sparkline chart and trend indicator
 *
 * Exports:
 *   - KPICard — metric card with value, trend, and sparkline
 *
 * Author:      AmanVatsSharma
 * Last-updated:2026-05-28
 */

"use client";

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

function Sparkline({ data, color, width = 62, height = 41 }: SparklineProps) {
  const maxVal = Math.max(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / maxVal) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  const gradId = color.replace("#", "");

  return (
    <svg width={width + 4} height={height + 8} className="inline-block">
      <defs>
        <linearGradient id={`grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${gradId})`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SparkBlockProps {
  label: string;
  data: number[];
  color: string;
}

function SparkBlock({ label, data, color }: SparkBlockProps) {
  return (
    <div className="flex flex-row items-end gap-2 w-[120px] h-[50px]">
      <div className="flex flex-col">
        <span className="text-base font-semibold text-black leading-6">{label}</span>
        <Sparkline data={data} color={color} />
      </div>
    </div>
  );
}

interface KPICardProps {
  label?: string;
  value: string | number;
  trend?: string;
  trendColor?: string;
  sparkData: number[];
  sparkColor: string;
  secondaryData?: number[];
  secondaryColor?: string;
  secondaryLabel?: string;
}

export function KPICard({
  label,
  value,
  trend,
  trendColor = "#00D1C6",
  sparkData,
  sparkColor,
  secondaryData,
  secondaryColor = "#4ECDC3",
  secondaryLabel = "Inquiry",
}: KPICardProps) {
  return (
    <div className="relative bg-white rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] px-5 pt-[75px] pb-5 w-[473px] min-h-[216px]">
      {/* Header: value + trend */}
      <div className="flex flex-row items-end gap-2.5 mb-6">
        <span className="text-2xl font-semibold text-[#1F2937] leading-8">{value}</span>
        {trend && (
          <span className="text-xs font-bold leading-4" style={{ color: trendColor }}>
            {trend}
          </span>
        )}
      </div>

      {/* Sparkline row */}
      <div className="flex flex-row items-center gap-[31px]">
        {label && <SparkBlock label={label} data={sparkData} color={sparkColor} />}
        {secondaryData && (
          <SparkBlock label={secondaryLabel} data={secondaryData} color={secondaryColor} />
        )}
      </div>

      {/* Divider */}
      <div className="absolute bottom-[60px] left-5 right-5 h-px border-t border-[#FF7847]" />
    </div>
  );
}