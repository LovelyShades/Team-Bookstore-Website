interface AvailabilityDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function AvailabilityDropdown({ value, onChange }: AvailabilityDropdownProps) {
  return (
    <select
      id="available"
      name="available"
      aria-label="Filter by availability"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-[160px] px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring cursor-pointer"
    >
      <option value="0">All Books</option>
      <option value="1">In Stock Only</option>
      <option value="2">Out of Stock</option>
    </select>
  );
}
