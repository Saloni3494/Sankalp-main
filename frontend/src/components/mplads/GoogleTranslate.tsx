import { useEffect } from "react";
import { Globe } from "lucide-react";

export function GoogleTranslate() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi,bn,te,mr,ta,gu,kn,ml", // English + 8 Indian Languages
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2 shadow-sm hover:bg-secondary transition-colors">
      <Globe className="size-3.5 text-muted-foreground hidden sm:block" />
      <div id="google_translate_element" className="flex items-center min-w-0"></div>
    </div>
  );
}
