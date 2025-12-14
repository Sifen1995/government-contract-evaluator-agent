import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  searchable?: boolean
  maxItems?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  searchable = true,
  maxItems,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchQuery])

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      if (maxItems && selected.length >= maxItems) {
        return
      }
      onChange([...selected, value])
    }
  }

  const removeOption = (value: string) => {
    onChange(selected.filter((v) => v !== value))
  }

  const getOptionLabel = (value: string) => {
    return options.find((opt) => opt.value === value)?.label || value
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs"
              >
                {getOptionLabel(value)}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeOption(value)
                  }}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {searchable && (
            <div className="p-2">
              <input
                type="text"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {maxItems && (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Selected: {selected.length}/{maxItems}
            </div>
          )}

          <div className="max-h-48 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                const isDisabled = Boolean(maxItems && !isSelected && selected.length >= maxItems)

                return (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer",
                      isSelected && "bg-primary/10",
                      !isDisabled && "hover:bg-accent",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isDisabled && toggleOption(option.value)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <span>{option.label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
