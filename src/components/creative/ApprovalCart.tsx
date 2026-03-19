import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface ApprovedItem {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  item_type: string;
}

interface ApprovalCartProps {
  items: ApprovedItem[];
  clientName: string;
  onViewSummary: () => void;
}

export function ApprovalCart({ items, clientName, onViewSummary }: ApprovalCartProps) {
  if (items.length === 0) return null;

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground uppercase tracking-wider">
              Approved Selections
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {items.map((item) => {
            const thumb = item.thumbnail_url || item.file_url;
            return (
              <div
                key={item.id}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/30 bg-secondary/30 relative"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.title || 'Approved'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-[8px]">
                    {item.item_type}
                  </div>
                )}
                <div className="absolute bottom-0.5 right-0.5">
                  <CheckCircle2 className="h-3 w-3 text-primary drop-shadow-md" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Selected by <span className="text-foreground font-medium">{clientName}</span>
          </p>
          <Button
            size="sm"
            onClick={onViewSummary}
            className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            View Summary
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
