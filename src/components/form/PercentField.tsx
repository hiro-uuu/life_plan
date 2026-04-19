import { NumberField } from './NumberField';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}

export function PercentField({ label, value, onChange, min, max, step, hint }: Props) {
  return (
    <NumberField
      label={label}
      value={value}
      onChange={onChange}
      step={step ?? 0.1}
      {...(min !== undefined ? { min } : {})}
      {...(max !== undefined ? { max } : {})}
      suffix="%"
      {...(hint !== undefined ? { hint } : {})}
    />
  );
}
