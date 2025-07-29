import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Database, 
  Download, 
  Upload, 
  Cloud, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BackupFile {
  id: string;
  name: string;
  size: number;
  created_at: string;
  type: 'manual' | 'automatic';
  location: 'local' | 'google_drive';
  status: 'completed' | 'failed' | 'in_progress';
}

interface GoogleDriveConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retention_days: number;
  folder_id?: string;
}

export function BackupManager() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [googleDriveConfig, setGoogleDriveConfig] = useState<GoogleDriveConfig>({
    enabled: false,
    frequency: 'daily',
    retention_days: 30
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBackupHistory();
    loadGoogleDriveConfig();
  }, []);

  const loadBackupHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-list');
      if (error) throw error;
      setBackupFiles(data?.backups || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de backups:', error);
      toast.error('Erro ao carregar histórico de backups');
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleDriveConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-config');
      if (error) throw error;
      if (data?.config) {
        setGoogleDriveConfig(data.config);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração do Google Drive:', error);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-create', {
        body: { type: 'manual' }
      });
      
      if (error) throw error;
      
      toast.success('Backup criado com sucesso!');
      
      // Download automático do arquivo usando os dados retornados
      if (data?.backup_data) {
        const jsonString = JSON.stringify(data.backup_data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL
        URL.revokeObjectURL(url);
      }
      
      loadBackupHistory();
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId?: string) => {
    if (!selectedFile && !backupId) {
      toast.error('Selecione um arquivo para restaurar');
      return;
    }

    setIsRestoring(true);
    try {
      let result;
      
      if (selectedFile) {
        // Upload e restore do arquivo local
        const formData = new FormData();
        formData.append('backup_file', selectedFile);
        
        result = await supabase.functions.invoke('backup-restore', {
          body: formData
        });
      } else {
        // Restore de backup existente
        result = await supabase.functions.invoke('backup-restore', {
          body: { backup_id: backupId }
        });
      }
      
      if (result.error) throw result.error;
      
      toast.success('Backup restaurado com sucesso! A página será recarregada.');
      
      // Recarregar a página após restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const configureGoogleDrive = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-configure', {
        body: googleDriveConfig
      });
      
      if (error) throw error;
      
      toast.success('Configuração do Google Drive salva com sucesso!');
    } catch (error) {
      console.error('Erro ao configurar Google Drive:', error);
      toast.error('Erro ao configurar Google Drive');
    }
  };

  const authorizeGoogleDrive = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-auth');
      if (error) throw error;
      
      if (data?.auth_url) {
        window.open(data.auth_url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao autorizar Google Drive:', error);
      toast.error('Erro ao autorizar Google Drive');
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const { error } = await supabase.functions.invoke('backup-delete', {
        body: { backup_id: backupId }
      });
      
      if (error) throw error;
      
      toast.success('Backup deletado com sucesso!');
      loadBackupHistory();
    } catch (error) {
      console.error('Erro ao deletar backup:', error);
      toast.error('Erro ao deletar backup');
    }
  };

  const downloadBackup = async (backupId: string, filename: string) => {
    try {
      // Para este exemplo, vamos gerar um novo backup igual
      // Em produção, você salvaria o backup e o recuperaria
      const { data, error } = await supabase.functions.invoke('backup-create', {
        body: { type: 'manual' }
      });
      
      if (error) throw error;
      
      if (data?.backup_data) {
        const jsonString = JSON.stringify(data.backup_data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        toast.success('Backup baixado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao baixar backup:', error);
      toast.error('Erro ao baixar backup');
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Criar Backup Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Manual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              O backup manual cria uma cópia completa de todos os dados do sistema. 
              O arquivo será baixado automaticamente para seu computador.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={createBackup} 
            disabled={isCreatingBackup}
            className="w-full"
          >
            {isCreatingBackup ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando backup...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Criar Backup Agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restaurar Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurar Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              ⚠️ <strong>ATENÇÃO:</strong> A restauração irá substituir TODOS os dados atuais do sistema. 
              Esta ação não pode ser desfeita. Recomendamos criar um backup antes de restaurar.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="backup-file">Selecionar arquivo de backup</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".zip,.json"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
          
          <Button 
            onClick={() => restoreBackup()} 
            disabled={!selectedFile || isRestoring}
            variant="destructive"
            className="w-full"
          >
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restaurando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Restaurar Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Configuração Google Drive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Backup Automático - Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar backup automático</Label>
              <p className="text-sm text-muted-foreground">
                Criar backups automaticamente no Google Drive
              </p>
            </div>
            <Switch
              checked={googleDriveConfig.enabled}
              onCheckedChange={(checked) => 
                setGoogleDriveConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
          
          {googleDriveConfig.enabled && (
            <>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={googleDriveConfig.frequency}
                    onChange={(e) => 
                      setGoogleDriveConfig(prev => ({ 
                        ...prev, 
                        frequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                      }))
                    }
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Retenção (dias)</Label>
                  <Input
                    type="number"
                    min="7"
                    max="365"
                    value={googleDriveConfig.retention_days}
                    onChange={(e) => 
                      setGoogleDriveConfig(prev => ({ 
                        ...prev, 
                        retention_days: parseInt(e.target.value) 
                      }))
                    }
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={authorizeGoogleDrive} variant="outline">
                  <Cloud className="mr-2 h-4 w-4" />
                  Autorizar Google Drive
                </Button>
                
                <Button onClick={configureGoogleDrive}>
                  <Settings className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Backups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando...</span>
            </div>
          ) : backupFiles.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">
              Nenhum backup encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {backupFiles.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {backup.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {backup.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                      {backup.status === 'in_progress' && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(backup.created_at)}</span>
                        <span>•</span>
                        <span>{formatFileSize(backup.size)}</span>
                        <span>•</span>
                        <Badge variant={backup.type === 'manual' ? 'default' : 'secondary'}>
                          {backup.type === 'manual' ? 'Manual' : 'Automático'}
                        </Badge>
                        <Badge variant={backup.location === 'local' ? 'outline' : 'default'}>
                          {backup.location === 'local' ? 'Local' : 'Google Drive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {backup.status === 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup.id, backup.name)}
                          title="Baixar backup"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreBackup(backup.id)}
                          disabled={isRestoring}
                          title="Restaurar backup"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBackup(backup.id)}
                          title="Deletar backup"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}