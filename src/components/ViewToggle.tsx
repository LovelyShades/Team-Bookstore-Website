import { Button } from "@/components/ui/button";
import { Grid3x3, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className={viewMode === 'grid' ? 'btn-primary' : ''}
      >
        <Grid3x3 className="h-4 w-4 mr-2" />
        Grid
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className={viewMode === 'list' ? 'btn-primary' : ''}
      >
        <List className="h-4 w-4 mr-2" />
        List
      </Button>
    </div>
  );
}
