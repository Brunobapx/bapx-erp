
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, UserCog } from 'lucide-react';

const CompanyInfo = () => {
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState({
    basic: {
      name: 'Empresa Demo ERP',
      tradingName: 'Demo ERP',
      cnpj: '12.345.678/0001-90',
      stateRegistration: '123456789',
      municipalRegistration: 'ISS12345',
      email: 'contato@demoerp.com.br',
      phone: '(11) 1234-5678',
      website: 'www.demoerp.com.br'
    },
    address: {
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Sala 123',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil'
    },
    fiscal: {
      crt: '1', // Simples Nacional
      cnae: '1234-5/67',
      activityStart: '2020-01-01',
      nature: 'Comércio varejista',
      regime: 'Simples Nacional',
      ieType: 'Contribuinte',
      substituteIE: '',
      sufframa: ''
    }
  });

  const handleInputChange = (
    section: 'basic' | 'address' | 'fiscal', 
    field: string, 
    value: string
  ) => {
    setCompanyData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = (section: 'basic' | 'address' | 'fiscal') => {
    toast({
      title: "Dados salvos",
      description: `Os dados ${
        section === 'basic' ? 'básicos' : 
        section === 'address' ? 'de endereço' : 'fiscais'
      } da empresa foram salvos com sucesso.`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da Empresa</CardTitle>
        <CardDescription>Gerencie as informações da sua empresa para uso em documentos e relatórios</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">
              <Building2 className="h-4 w-4 mr-2" />
              Dados Básicos
            </TabsTrigger>
            <TabsTrigger value="address">
              <MapPin className="h-4 w-4 mr-2" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="fiscal">
              <UserCog className="h-4 w-4 mr-2" />
              Dados Fiscais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Razão Social</Label>
                <Input 
                  id="name" 
                  value={companyData.basic.name} 
                  onChange={(e) => handleInputChange('basic', 'name', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradingName">Nome Fantasia</Label>
                <Input 
                  id="tradingName" 
                  value={companyData.basic.tradingName} 
                  onChange={(e) => handleInputChange('basic', 'tradingName', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input 
                  id="cnpj" 
                  value={companyData.basic.cnpj} 
                  onChange={(e) => handleInputChange('basic', 'cnpj', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                <Input 
                  id="stateRegistration" 
                  value={companyData.basic.stateRegistration} 
                  onChange={(e) => handleInputChange('basic', 'stateRegistration', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="municipalRegistration">Inscrição Municipal</Label>
                <Input 
                  id="municipalRegistration" 
                  value={companyData.basic.municipalRegistration} 
                  onChange={(e) => handleInputChange('basic', 'municipalRegistration', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={companyData.basic.email} 
                  onChange={(e) => handleInputChange('basic', 'email', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  value={companyData.basic.phone} 
                  onChange={(e) => handleInputChange('basic', 'phone', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  value={companyData.basic.website} 
                  onChange={(e) => handleInputChange('basic', 'website', e.target.value)} 
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => handleSave('basic')}>Salvar Dados Básicos</Button>
            </div>
          </TabsContent>

          <TabsContent value="address" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="street">Logradouro</Label>
                <Input 
                  id="street" 
                  value={companyData.address.street} 
                  onChange={(e) => handleInputChange('address', 'street', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input 
                  id="number" 
                  value={companyData.address.number} 
                  onChange={(e) => handleInputChange('address', 'number', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input 
                  id="complement" 
                  value={companyData.address.complement} 
                  onChange={(e) => handleInputChange('address', 'complement', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input 
                  id="neighborhood" 
                  value={companyData.address.neighborhood} 
                  onChange={(e) => handleInputChange('address', 'neighborhood', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input 
                  id="city" 
                  value={companyData.address.city} 
                  onChange={(e) => handleInputChange('address', 'city', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select 
                  value={companyData.address.state}
                  onValueChange={(value) => handleInputChange('address', 'state', value)}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map(
                      (state) => <SelectItem key={state} value={state}>{state}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input 
                  id="zipCode" 
                  value={companyData.address.zipCode} 
                  onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input 
                  id="country" 
                  value={companyData.address.country} 
                  onChange={(e) => handleInputChange('address', 'country', e.target.value)} 
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => handleSave('address')}>Salvar Endereço</Button>
            </div>
          </TabsContent>

          <TabsContent value="fiscal" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="crt">Código de Regime Tributário (CRT)</Label>
                <Select 
                  value={companyData.fiscal.crt}
                  onValueChange={(value) => handleInputChange('fiscal', 'crt', value)}
                >
                  <SelectTrigger id="crt">
                    <SelectValue placeholder="Selecione o CRT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Simples Nacional</SelectItem>
                    <SelectItem value="2">2 - Simples Nacional (excesso sublimite)</SelectItem>
                    <SelectItem value="3">3 - Regime Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnae">CNAE Principal</Label>
                <Input 
                  id="cnae" 
                  value={companyData.fiscal.cnae} 
                  onChange={(e) => handleInputChange('fiscal', 'cnae', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activityStart">Início de Atividade</Label>
                <Input 
                  id="activityStart" 
                  type="date"
                  value={companyData.fiscal.activityStart} 
                  onChange={(e) => handleInputChange('fiscal', 'activityStart', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nature">Natureza Jurídica</Label>
                <Input 
                  id="nature" 
                  value={companyData.fiscal.nature} 
                  onChange={(e) => handleInputChange('fiscal', 'nature', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regime">Regime Tributário</Label>
                <Select 
                  value={companyData.fiscal.regime}
                  onValueChange={(value) => handleInputChange('fiscal', 'regime', value)}
                >
                  <SelectTrigger id="regime">
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                    <SelectItem value="MEI">MEI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ieType">Tipo de Inscrição Estadual</Label>
                <Select 
                  value={companyData.fiscal.ieType}
                  onValueChange={(value) => handleInputChange('fiscal', 'ieType', value)}
                >
                  <SelectTrigger id="ieType">
                    <SelectValue placeholder="Selecione o tipo de IE" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contribuinte">Contribuinte</SelectItem>
                    <SelectItem value="Contribuinte Isento">Contribuinte Isento</SelectItem>
                    <SelectItem value="Não Contribuinte">Não Contribuinte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="substituteIE">IE Substituto Tributário</Label>
                <Input 
                  id="substituteIE" 
                  value={companyData.fiscal.substituteIE} 
                  onChange={(e) => handleInputChange('fiscal', 'substituteIE', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sufframa">Inscrição SUFRAMA</Label>
                <Input 
                  id="sufframa" 
                  value={companyData.fiscal.sufframa} 
                  onChange={(e) => handleInputChange('fiscal', 'sufframa', e.target.value)} 
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => handleSave('fiscal')}>Salvar Dados Fiscais</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompanyInfo;
