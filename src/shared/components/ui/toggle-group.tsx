import * as React from 'react';
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { cn } from '@/shared/lib/utils';

// shadcn/ui ToggleGroup: a segmented control where exactly one option is on (type="single").
function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn('flex w-full items-center rounded-xl border border-white/15 bg-black/40 p-1 gap-1', className)}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        'flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap',
        'text-slate-300 transition-colors cursor-pointer hover:text-white hover:bg-white/5',
        'outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60',
        'data-[state=on]:bg-indigo-600 data-[state=on]:text-white data-[state=on]:hover:bg-indigo-600',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5',
        className
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
