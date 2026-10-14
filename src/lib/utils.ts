import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The console type scale (text-adm-*) is a font size. Unregistered, tailwind-merge
// reads it as a text colour and drops it whenever a colour class follows.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "adm-xs", "adm-base", "adm-md", "adm-lg", "adm-xl", "adm-2xl",
        // The site scale (globals.css, SITE_DESIGN_LANGUAGE §2)
        "caption", "small", "body", "title", "lead", "head-sm", "head-md", "head", "head-xl", "poster", "hero", "hero-tile",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
