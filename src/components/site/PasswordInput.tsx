import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Input password con toggle mostra/nascondi.
// - Il toggle è type="button" e non ruba il focus all'input (mousedown
//   annullato): su iOS/Safari la perdita di focus rimaschera il campo.
// - Se il valore è stato inserito dall'autofill del browser (sfondo giallo,
//   "password sicura" di Safari, anteprima di Chrome) il browser lo tiene
//   mascherato a prescindere dal type: lo segnaliamo invece di far sembrare
//   rotto il pulsante.
export const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type: _type, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const [autofilled, setAutofilled] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    function isAutofilled(): boolean {
      const el = inputRef.current;
      if (!el) return false;
      try {
        return el.matches(":autofill") || el.matches(":-webkit-autofill");
      } catch {
        return false;
      }
    }

    function toggle() {
      const next = !visible;
      setVisible(next);
      setAutofilled(next && isAutofilled());
      inputRef.current?.focus();
    }

    return (
      <div>
        <div className="relative">
          <Input
            ref={setRefs}
            type={visible ? "text" : "password"}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={cn("pr-10", className)}
            {...props}
            onInput={(e) => {
              setAutofilled(false);
              props.onInput?.(e);
            }}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggle}
            aria-label={visible ? "Nascondi password" : "Mostra password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {visible && autofilled && (
          <p className="mt-1 text-xs text-muted-foreground">
            Password inserita dal browser: per motivi di sicurezza il browser non la mostra.
            Digitala tu per vederla in chiaro.
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
