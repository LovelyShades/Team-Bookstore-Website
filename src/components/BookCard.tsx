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
      className={`overflow-hidden border border-border hover:shadow-lg transition-all duration-300 group h-full flex flex-col ${
        compact ? "" : "max-w-sm"
      }`}
    >
      {/* FIXED ASPECT RATIO — matches Latest Releases EXACTLY */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-muted">
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
        
        {/* In Stock Badge */}
        {stock > 0 && (
          <Badge className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs shadow-md">
            {stock === 1 ? "1 left" : `${stock} left`}
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
        <h3
          className={`font-bold text-foreground line-clamp-2 mb-1 group-hover:text-accent transition-colors ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {title}
        </h3>

        <p
          className={`text-muted-foreground mb-2 line-clamp-1 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {author}
        </p>

        {/* PRICE */}
        <div className="mt-auto flex items-center gap-2">
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
