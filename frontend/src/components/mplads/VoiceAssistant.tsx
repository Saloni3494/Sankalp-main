import { useState } from "react";
import { Mic, MicOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      // Simulate processing
      setTimeout(() => {
        setResponse("High-risk works in Maharashtra typically involve payment anomalies and peer deviation. I have filtered the dashboard for you.");
      }, 1000);
    } else {
      setIsListening(true);
      setQuery("");
      setResponse("");
      // Simulate speech recognition
      let text = "Show high-risk works in Maharashtra...";
      let i = 0;
      const interval = setInterval(() => {
        setQuery(text.slice(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 50);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="hidden sm:flex items-center gap-2 bg-navy text-white hover:bg-navy/90 hover:text-white border-none rounded-full px-4 h-9">
          <Mic className="size-4" />
          Talk to SANKALP
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <h3 className="font-semibold text-navy">Voice Assistant</h3>
          
          <button 
            onClick={handleMicClick}
            className={cn(
              "size-16 rounded-full flex items-center justify-center transition-all",
              isListening ? "bg-red-100 text-danger animate-pulse" : "bg-primary-soft text-primary hover:bg-primary/20"
            )}
          >
            {isListening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </button>
          
          <div className="text-sm min-h-[40px] text-muted-foreground w-full bg-secondary/50 p-2 rounded">
            {isListening ? (
              <span className="italic">{query || "Listening..."}</span>
            ) : response ? (
              <span className="text-foreground font-medium">{response}</span>
            ) : (
              <span>Tap the microphone and speak.</span>
            )}
          </div>

          {!isListening && !response && (
            <div className="w-full text-left mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Try saying:</p>
              <ul className="text-xs space-y-1 text-primary">
                <li>"Show high-risk works in Maharashtra"</li>
                <li>"What should I do next?"</li>
                <li>"Start investigation"</li>
              </ul>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
