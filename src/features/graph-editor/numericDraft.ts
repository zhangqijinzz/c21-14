/**
 * 数字输入框的草稿规则：输入过程与最终值分离。
 * 清空、输入中途的非法文本只停留在草稿层，解析为 null，不写入模型；
 * 只有解析出有限数字时才允许提交，合法的 0 与空输入严格区分。
 */
export function parseNumericDraft(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** 模型值回显：历史数据里的 0 必须显示为 "0"，不能被当成没填。 */
export function formatNumericValue(value: number): string {
  return String(value);
}
