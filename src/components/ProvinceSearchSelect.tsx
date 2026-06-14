import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { THAI_PROVINCES } from "@/lib/thai-provinces";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ProvinceSearchSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
};

/** Dropdown จังหวัด — พิมพ์ค้นหาได้ */
export function ProvinceSearchSelect({
  value,
  onChange,
  disabled,
  placeholder = "— เลือกจังหวัด —",
  className,
  allowClear = true,
}: ProvinceSearchSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between px-3 font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="พิมพ์ค้นหาจังหวัด..." />
          <CommandList>
            <CommandEmpty>ไม่พบจังหวัดที่ค้นหา</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {placeholder}
                </CommandItem>
              )}
              {THAI_PROVINCES.map((province) => (
                <CommandItem
                  key={province}
                  value={province}
                  onSelect={() => {
                    onChange(province);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === province ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {province}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
