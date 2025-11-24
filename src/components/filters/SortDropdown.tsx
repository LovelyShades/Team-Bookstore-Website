import { ChevronDown } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  priceMin: number;
  priceMax: number;
  onPriceChange: (min: number, max: number) => void;
  showPriceRange?: boolean;
}

export function SortDropdown({
  sortValue,
  onSortChange,
  sortOptions,
  priceMin,
  priceMax,
  onPriceChange,
  showPriceRange = true,
}: SortDropdownProps) {
  const currentLabel = sortOptions.find(opt => opt.value === sortValue)?.label || sortOptions[0]?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex-1 min-w-[250px] px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring cursor-pointer text-left flex items-center justify-between"
        >
          <span>{currentLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <DropdownMenuRadioGroup value={sortValue} onValueChange={onSortChange}>
          {sortOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        {showPriceRange && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-3" onPointerDown={(e) => e.stopPropagation()}>
              <label className="text-sm font-medium mb-2 block">
                Price Range: ${priceMin} - ${priceMax}
              </label>
              <Slider
                min={0}
                max={100}
                step={1}
                minStepsBetweenThumbs={0}
                value={[priceMin, priceMax]}
                onValueChange={(vals) => onPriceChange(vals[0], vals[1])}
                className="mb-2"
              />
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
