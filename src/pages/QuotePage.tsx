import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuoteForm } from "@/components/Quote/QuoteForm";
import { QuotePreview } from "@/components/Quote/QuotePreview";
import { QuoteList } from "@/components/Quote/QuoteList";
import { FileText, Plus } from "lucide-react";
import { Quote, useQuotes } from "@/hooks/useQuotes";

export const QuotePage = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { approveQuote } = useQuotes();

  const handleCreateNew = () => {
    setSelectedQuote(null);
    setIsCreating(true);
    setActiveTab("form");
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsCreating(false);
    setActiveTab("form");
  };

  const handleQuoteSaved = () => {
    setActiveTab("list");
    setSelectedQuote(null);
    setIsCreating(false);
  };

  const handleApproveQuote = async (quote: Quote) => {
    try {
      await approveQuote(quote);
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-gray-600">Gerencie propostas comerciais para seus clientes</p>
          </div>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Orçamentos</TabsTrigger>
          <TabsTrigger value="form">
            {isCreating ? "Novo Orçamento" : "Editar Orçamento"}
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!selectedQuote}>
            Visualizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Orçamentos Criados</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteList 
                onEditQuote={handleEditQuote}
                onPreviewQuote={(quote) => {
                  setSelectedQuote(quote);
                  setActiveTab("preview");
                }}
                onApproveQuote={handleApproveQuote}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? "Criar Novo Orçamento" : "Editar Orçamento"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteForm 
                quote={selectedQuote}
                onSave={handleQuoteSaved}
                onCancel={() => setActiveTab("list")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          {selectedQuote && (
            <Card>
              <CardHeader>
                <CardTitle>Visualização do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <QuotePreview quote={selectedQuote} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuotePage;