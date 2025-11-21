import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  title: string;
  author: string;
  price: string;
  originalPrice?: string;
  image: string;
  stock: number;
  onSale?: boolean;
  compact?: boolean;
}

export function BookCard({
  title,
  author,
  price,
  originalPrice,
  image,
  stock,
  onSale = false,
  compact = false,
}: BookCardProps) {
  return (
    <Card
      className={`overflow-hidden border border-border hover:shadow-lg transition-all duration-300 group flex flex-col ${
        compact ? "" : "max-w-sm"
      }`}
      style={{ height: '100%' }}
    >
      {/* FIXED ASPECT RATIO — matches Latest Releases EXACTLY */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-muted flex-shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />

        {/* OUT OF STOCK BADGE */}
        {stock === 0 && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            Out of Stock
          </Badge>
        )}

        {/* SALE BADGE */}
        {onSale && (
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground shadow-md">
            Sale
          </Badge>
        )}
      </div>

      <CardContent className={`flex-1 flex flex-col ${compact ? "p-3" : "p-4"}`}>
        {/* Title with fixed height */}
        <h3
          className={`font-bold text-foreground line-clamp-2 group-hover:text-accent transition-colors ${
            compact ? "text-sm min-h-[2.5rem]" : "text-base min-h-[3rem]"
          }`}
        >
          {title}
        </h3>

        {/* Author with fixed height */}
        <p
          className={`text-muted-foreground line-clamp-1 ${
            compact ? "text-xs mb-2" : "text-sm mb-3"
          }`}
        >
          {author}
        </p>

        {/* Spacer to push price to bottom */}
        <div className="flex-1"></div>

        {/* PRICE - always at bottom */}
        <div className="flex items-center gap-2 mt-auto">
          <span
            className={`font-bold text-foreground ${
              compact ? "text-sm" : "text-lg"
            }`}
          >
            {price}
          </span>

          {originalPrice && onSale && (
            <span
              className={`line-through text-muted-foreground ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              {originalPrice}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
