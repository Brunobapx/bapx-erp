
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building, Save } from "lucide-react";

// Mock company data
const initialCompanyData = {
  razaoSocial: 'Minha Empresa LTDA',
  cnpj: '12.345.678/0001-90',
  inscricaoEstadual: '123456789',
  endereco: 'Av. Exemplo, 123 - Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  telefone: '(11) 1234-5678',
  email: 'contato@minhaempresa.com',
  website: 'www.minhaempresa.com',
  areaAtuacao: 'Tecnologia',
  descricao: 'Empresa especializada em soluções tecnológicas inovadoras.'
};

const CompanyData = () => {
  const [companyData, setCompanyData] = useState(initialCompanyData);
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyData({
      ...companyData,
      [name]: value
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // Here would be the API call to save the data
    toast.success('Dados da empresa salvos com sucesso');
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Dados da Empresa</CardTitle>
            <CardDescription>
              Informações cadastrais da sua empresa
            </CardDescription>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" /> Salvar Alterações
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input
                id="razaoSocial"
                name="razaoSocial"
                value={companyData.razaoSocial}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={companyData.cnpj}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                <Input
                  id="inscricaoEstadual"
                  name="inscricaoEstadual"
                  value={companyData.inscricaoEstadual}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                name="endereco"
                value={companyData.endereco}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={companyData.cidade}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  value={companyData.estado}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  value={companyData.cep}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                value={companyData.telefone}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={companyData.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={companyData.website}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="areaAtuacao">Área de Atuação</Label>
              <Input
                id="areaAtuacao"
                name="areaAtuacao"
                value={companyData.areaAtuacao}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="descricao">Descrição da Empresa</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={companyData.descricao}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyData;
