import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Upload, Package, FileX, Check, AlertTriangle, Link } from 'lucide-react';

interface Purchase {
  id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: 'pending' | 'processed' | 'cancelled';
  created_at: string;
}

interface PurchaseItem {
  id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ncm: string;
  unit: string;
  product_id?: string;
}

interface Vendor {
  id: string;
  name: string;
  cnpj: string;
}

interface Product {
  id: string;
  name: string;
  code?: string;
  stock: number;
  cost: number;
}

interface ProductAssociation {
  purchaseItemId: string;
  productId: string | null;
  createNew: boolean;
}

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [productAssociations, setProductAssociations] = useState<ProductAssociation[]>([]);

  useEffect(() => {
    loadPurchases();
    loadVendors();
    loadProducts();
  }, []);

  const loadPurchases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar compras:', error);
      toast.error('Erro ao carregar compras');
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, stock, cost')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const parseXMLFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const xmlContent = e.target?.result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
          
          // Extrair dados básicos da nota fiscal
          const nfeProc = xmlDoc.querySelector('nfeProc');
          const infNFe = xmlDoc.querySelector('infNFe');
          const ide = xmlDoc.querySelector('ide');
          const emit = xmlDoc.querySelector('emit');
          const det = xmlDoc.querySelectorAll('det');

          if (!infNFe || !ide || !emit) {
            throw new Error('XML inválido - estrutura NFe não encontrada');
          }

          const nfeData = {
            chaveNFe: infNFe.getAttribute('Id')?.replace('NFe', '') || '',
            numeroNF: ide.querySelector('nNF')?.textContent || '',
            dataEmissao: ide.querySelector('dhEmi')?.textContent?.split('T')[0] || '',
            fornecedor: {
              nome: emit.querySelector('xNome')?.textContent || '',
              cnpj: emit.querySelector('CNPJ')?.textContent || ''
            },
            itens: Array.from(det).map((item, index) => {
              const prod = item.querySelector('prod');
              return {
                codigo: prod?.querySelector('cProd')?.textContent || '',
                nome: prod?.querySelector('xProd')?.textContent || '',
                ncm: prod?.querySelector('NCM')?.textContent || '',
                unidade: prod?.querySelector('uCom')?.textContent || 'UN',
                quantidade: parseFloat(prod?.querySelector('qCom')?.textContent || '0'),
                valorUnitario: parseFloat(prod?.querySelector('vUnCom')?.textContent || '0'),
                valorTotal: parseFloat(prod?.querySelector('vProd')?.textContent || '0')
              };
            }),
            valorTotal: Array.from(det).reduce((total, item) => {
              const valorProd = parseFloat(item.querySelector('prod vProd')?.textContent || '0');
              return total + valorProd;
            }, 0),
            xmlContent: xmlContent
          };

          resolve(nfeData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  const checkOrCreateVendor = async (vendorName: string, vendorCnpj: string, userId: string) => {
    try {
      // Verificar se fornecedor já existe
      const { data: existingVendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', userId)
        .or(`name.eq.${vendorName},cnpj.eq.${vendorCnpj}`)
        .limit(1);

      if (vendorError) throw vendorError;

      if (existingVendor && existingVendor.length > 0) {
        return existingVendor[0];
      }

      // Criar novo fornecedor
      const { data: newVendor, error: createError } = await supabase
        .from('vendors')
        .insert({
          user_id: userId,
          name: vendorName,
          cnpj: vendorCnpj
        })
        .select()
        .single();

      if (createError) throw createError;
      return newVendor;
    } catch (error) {
      console.error('Erro ao verificar/criar fornecedor:', error);
      throw error;
    }
  };

  const handleFileImport = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo XML');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const nfeData = await parseXMLFile(selectedFile);
      
      // Verificar ou criar fornecedor
      const vendor = await checkOrCreateVendor(
        nfeData.fornecedor.nome,
        nfeData.fornecedor.cnpj,
        user.id
      );
      
      // Inserir compra
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          vendor_id: vendor.id,
          vendor_name: nfeData.fornecedor.nome,
          invoice_number: nfeData.numeroNF,
          invoice_key: nfeData.chaveNFe,
          invoice_date: nfeData.dataEmissao,
          total_amount: nfeData.valorTotal,
          xml_content: nfeData.xmlContent,
          status: 'pending'
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Inserir itens da compra
      const purchaseItems = nfeData.itens.map((item: any) => ({
        user_id: user.id,
        purchase_id: purchase.id,
        product_code: item.codigo,
        product_name: item.nome,
        quantity: item.quantidade,
        unit_price: item.valorUnitario,
        total_price: item.valorTotal,
        ncm: item.ncm,
        unit: item.unidade
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      // Criar lançamento em contas a pagar automaticamente
      const dueDate = new Date(nfeData.dataEmissao);
      dueDate.setDate(dueDate.getDate() + 30); // Vencimento padrão de 30 dias

      const { error: payableError } = await supabase
        .from('accounts_payable')
        .insert({
          user_id: user.id,
          purchase_id: purchase.id,
          supplier_name: nfeData.fornecedor.nome,
          description: `Compra - NF ${nfeData.numeroNF}`,
          amount: nfeData.valorTotal,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pending',
          category: 'Compras',
          invoice_number: nfeData.numeroNF,
          notes: `Importação automática - XML processado em ${new Date().toLocaleDateString('pt-BR')}`
        });

      if (payableError) throw payableError;

      toast.success('XML importado com sucesso! Fornecedor e conta a pagar criados automaticamente.');
      setIsImportModalOpen(false);
      setSelectedFile(null);
      loadPurchases();
      loadVendors();
    } catch (error: any) {
      console.error('Erro ao importar XML:', error);
      toast.error(error.message || 'Erro ao importar XML');
    } finally {
      setLoading(false);
    }
  };

  const openProcessModal = async (purchase: Purchase) => {
    try {
      const { data: items, error } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', purchase.id);

      if (error) throw error;

      setPurchaseItems(items || []);
      setSelectedPurchase(purchase);
      
      // Inicializar associações
      const associations = (items || []).map(item => ({
        purchaseItemId: item.id,
        productId: null,
        createNew: true
      }));
      setProductAssociations(associations);
      setIsProcessModalOpen(true);
    } catch (error: any) {
      console.error('Erro ao carregar itens:', error);
      toast.error('Erro ao carregar itens da compra');
    }
  };

  const updateAssociation = (itemId: string, productId: string | null, createNew: boolean) => {
    setProductAssociations(prev => 
      prev.map(assoc => 
        assoc.purchaseItemId === itemId 
          ? { ...assoc, productId, createNew }
          : assoc
      )
    );
  };

  const processPurchase = async () => {
    if (!selectedPurchase) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      for (const item of purchaseItems) {
        const association = productAssociations.find(a => a.purchaseItemId === item.id);
        if (!association) continue;

        if (association.createNew) {
          // Criar novo produto
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert({
              user_id: user.id,
              name: item.product_name,
              code: item.product_code,
              stock: item.quantity,
              cost: item.unit_price,
              price: item.unit_price * 1.3, // Margem padrão de 30%
              ncm: item.ncm,
              unit: item.unit
            })
            .select()
            .single();

          if (productError) throw productError;

          // Associar item com novo produto
          const { error: linkError } = await supabase
            .from('purchase_items')
            .update({ product_id: newProduct.id })
            .eq('id', item.id);

          if (linkError) throw linkError;

        } else if (association.productId) {
          // Atualizar produto existente
          const existingProduct = products.find(p => p.id === association.productId);
          if (existingProduct) {
            const newStock = existingProduct.stock + item.quantity;
            
            const { error: updateError } = await supabase
              .from('products')
              .update({
                stock: newStock,
                cost: item.unit_price, // Atualizar preço de custo
                updated_at: new Date().toISOString()
              })
              .eq('id', association.productId);

            if (updateError) throw updateError;

            // Associar item com produto existente
            const { error: linkError } = await supabase
              .from('purchase_items')
              .update({ product_id: association.productId })
              .eq('id', item.id);

            if (linkError) throw linkError;
          }
        }
      }

      // Marcar compra como processada
      const { error: statusError } = await supabase
        .from('purchases')
        .update({ status: 'processed' })
        .eq('id', selectedPurchase.id);

      if (statusError) throw statusError;

      toast.success('Compra processada com sucesso! Estoque, produtos e contas a pagar atualizados.');
      setIsProcessModalOpen(false);
      loadPurchases();
      loadProducts();
    } catch (error: any) {
      console.error('Erro ao processar compra:', error);
      toast.error('Erro ao processar compra');
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseItems = async (purchaseId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', purchaseId);

      if (error) throw error;
      setPurchaseItems(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'processed':
        return <Badge variant="default">Processada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading && purchases.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando compras...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Compras</h1>
        </div>
        <Button onClick={() => setIsImportModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importar XML NFe
        </Button>
      </div>

      <Tabs defaultValue="purchases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Compras
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nota Fiscal</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.invoice_number}</TableCell>
                      <TableCell>{purchase.vendor_name}</TableCell>
                      <TableCell>{new Date(purchase.invoice_date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">R$ {purchase.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              loadPurchaseItems(purchase.id);
                            }}
                          >
                            Ver Itens
                          </Button>
                          {purchase.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => openProcessModal(purchase)}
                              disabled={loading}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Processar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.cnpj}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Importação XML */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar XML da Nota Fiscal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="xmlFile">Arquivo XML</Label>
              <Input
                id="xmlFile"
                type="file"
                accept=".xml"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleFileImport} disabled={!selectedFile || loading}>
                {loading ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Processamento */}
      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Processar Compra - {selectedPurchase?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure como cada item será processado no estoque:
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Produto Associado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((item) => {
                  const association = productAssociations.find(a => a.purchaseItemId === item.id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-500">Cód: {item.product_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity} {item.unit}</TableCell>
                      <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={association?.createNew ? 'new' : association?.productId || 'new'}
                          onValueChange={(value) => {
                            if (value === 'new') {
                              updateAssociation(item.id, null, true);
                            } else {
                              updateAssociation(item.id, value, false);
                            }
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Criar Novo</SelectItem>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                Associar a {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {association?.createNew ? (
                          <Badge variant="outline">Novo Produto</Badge>
                        ) : association?.productId ? (
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            <span className="text-sm">
                              {products.find(p => p.id === association.productId)?.name}
                            </span>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsProcessModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={processPurchase} disabled={loading}>
                {loading ? 'Processando...' : 'Processar Compra'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Itens da Compra */}
      {selectedPurchase && !isProcessModalOpen && (
        <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>
                Itens da Nota Fiscal {selectedPurchase.invoice_number}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_code}</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity} {item.unit}</TableCell>
                      <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>R$ {item.total_price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PurchasesPage;
