import '../css/Dropdown.css';

export type DropdownOptions<
  V extends string = string,
  L extends string = string,
> = {
  label: L;
  value: V;
  icon?: React.ReactNode;
};

interface DropdownProps<V extends string> {
  data: DropdownOptions<V>[];
  label?: string;
  currentValue: DropdownOptions<V>;
  disabled?: boolean;
  variant?: 'small' | 'medium' | 'large' | 'full';
  onChange: (value: V) => void;
}

function Dropdown<V extends string>({
  data,
  label,
  currentValue,
  onChange,
  disabled = false,
  variant = 'medium',
}: DropdownProps<V>) {
  return (
    <div className={`dropdown ${variant}`}>
      <div className="dropdown__label-container">{label}</div>
      <div></div>
      <select
        className={variant}
        disabled={disabled}
        value={currentValue.value}
        onChange={(e) => onChange(e.target.value as V)}
      >
        {data.map((select) => {
          return (
            <option key={select.value} value={select.value}>
              {select.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default Dropdown;
