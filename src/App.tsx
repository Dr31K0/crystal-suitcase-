
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SuitcaseProvider } from "@/context/SuitcaseContext";
import Index from "./pages/Index";
import Details from "./pages/Details";
import Configure from "./pages/Configure";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SuitcaseProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/details" element={<Details />} />
            <Route path="/configure" element={<Configure />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SuitcaseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
