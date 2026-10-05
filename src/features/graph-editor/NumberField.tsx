import { useState } from "react";

/**
 * 解析输入草稿。空串、负号半成品、非有限数字都视为「暂不合法」，
 * 返回 null；合法的 0 是有效值，不会被当成未填。
 */
export function parseNumericDraft(draft: string): number | null {
  if (draft.trim() === "") return null;
  const parsed = Number(draft);
  return Number.isFinite(parsed) ? parsed : null;
}

interface NumberFieldProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (value: number) => void;
}

/**
 * 把「输入过程」和「落模值」分开的数值输入框：
 * - 合法数字即时提交，保留连续修改（逐位输入、步进箭头）的顺手体验；
 * - 清空等暂不合法的草稿只留在本地，不触发 onCommit，
 *   避免默认值 0 污染链路推演、自动保存和方案快照；
 * - 失焦或回车时结算：草稿合法则落模，否则回显模型中的当前值。
 */
export default function NumberField({
  value,
  min = 0,
  max,
  step,
  onCommit,
}: NumberFieldProps) {
  // draft 为 null 表示未在编辑，直接展示模型值（含历史数据里合法的 0）
  const [draft, setDraft] = useState<string | null>(null);

  const settle = (raw: string | null) => {
    const parsed = raw === null ? null : parseNumericDraft(raw);
    if (parsed !== null && parsed !== value) onCommit(parsed);
    setDraft(null);
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft ?? String(value)}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        const parsed = parseNumericDraft(raw);
        if (parsed !== null && parsed !== value) onCommit(parsed);
      }}
      onBlur={(event) => settle(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}
