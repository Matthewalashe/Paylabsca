import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        draft: "bg-gray-100 text-gray-700",
        pending: "bg-amber-50 text-amber-700 border border-amber-200",
        approved: "bg-green-50 text-green-700 border border-green-200",
        sent: "bg-blue-50 text-blue-700 border border-blue-200",
        paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        overdue: "bg-red-50 text-red-700 border border-red-200",
        rejected: "bg-red-50 text-red-600 border border-red-200",
        success: "bg-green-100 text-green-800",
        destructive: "bg-red-100 text-red-800",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
