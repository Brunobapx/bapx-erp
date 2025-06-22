
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RateLimitStatus } from './types';

interface RateLimitCardsProps {
  rateLimitStatus: RateLimitStatus;
}

export const RateLimitCards: React.FC<RateLimitCardsProps> = ({ rateLimitStatus }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rate Limit Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Requests restantes:</span>
              <Badge variant={rateLimitStatus.general?.remaining && rateLimitStatus.general.remaining > 10 ? 'default' : 'destructive'}>
                {rateLimitStatus.general?.remaining || 0}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Reset: {rateLimitStatus.general?.resetTime ? 
                new Date(rateLimitStatus.general.resetTime).toLocaleTimeString('pt-BR') : 
                'N/A'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rate Limit Login</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Tentativas restantes:</span>
              <Badge variant={rateLimitStatus.login?.remaining && rateLimitStatus.login.remaining > 1 ? 'default' : 'destructive'}>
                {rateLimitStatus.login?.remaining || 0}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Reset: {rateLimitStatus.login?.resetTime ? 
                new Date(rateLimitStatus.login.resetTime).toLocaleTimeString('pt-BR') : 
                'N/A'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rate Limit Criar Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Criações restantes:</span>
              <Badge variant={rateLimitStatus.createUser?.remaining && rateLimitStatus.createUser.remaining > 2 ? 'default' : 'destructive'}>
                {rateLimitStatus.createUser?.remaining || 0}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Reset: {rateLimitStatus.createUser?.resetTime ? 
                new Date(rateLimitStatus.createUser.resetTime).toLocaleTimeString('pt-BR') : 
                'N/A'
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
