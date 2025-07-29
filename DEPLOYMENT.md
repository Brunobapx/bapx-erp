# Deployment Guide

## EasyPanel Deployment (com Setup Automático)

### Prerequisites
- EasyPanel instance running
- GitHub repository with this code
- Supabase project configured

### Step 1: Create Application in EasyPanel

1. Login to your EasyPanel dashboard
2. Click "Create" → "Application"
3. Choose "GitHub" as source
4. Connect your GitHub repository
5. Set the following configuration:

```yaml
Name: erp-system
Build Command: bun install && bun run build
Start Command: nginx -g "daemon off;"
Port: 80
```

### Step 2: Environment Variables

Add these environment variables in EasyPanel:

```
VITE_SUPABASE_URL=https://gtqmwlxzszttzriswoxj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cW13bHh6c3p0dHpyaXN3b3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NzUwMjUsImV4cCI6MjA2MzM1MTAyNX0.03XyZCOF5UnUUaNpn44-MlQW0J6Vfo3_rb7mhE7D-Bk
```

### Step 3: Deploy

1. Click "Deploy" in EasyPanel
2. Wait for the build to complete
3. **O sistema irá configurar automaticamente o banco de dados na primeira execução**
4. Access your application via the provided URL

### 🎉 Setup Automático

O sistema agora **cria automaticamente todas as tabelas** quando instalado em uma VPS com banco vazio:

- ✅ **Detecção Automática**: Verifica se é primeira instalação
- ✅ **Criação de Tabelas**: Cria todas as tabelas e relacionamentos
- ✅ **Dados Iniciais**: Módulos, categorias, métodos de pagamento
- ✅ **Usuário Master**: Cria automaticamente (bapx@bapx.com.br / 123456)
- ✅ **Configurações Padrão**: Markup, fiscal, sistema

## Docker Deployment

### Option 1: Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your Supabase credentials

4. Start the application:
```bash
docker-compose up -d
```

5. Access at http://localhost:3000

### Option 2: Docker Build & Run

1. Build the image:
```bash
docker build -t erp-system .
```

2. Run the container:
```bash
docker run -d \
  --name erp-system \
  -p 3000:80 \
  -e VITE_SUPABASE_URL=https://gtqmwlxzszttzriswoxj.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=your-anon-key \
  erp-system
```

## Production Considerations

### 1. Environment Variables
- Always use environment variables for sensitive data
- Never commit real credentials to Git
- Use different Supabase projects for dev/staging/production

### 2. Domain & SSL
- Configure your domain in EasyPanel or reverse proxy
- Enable SSL/TLS certificates
- Update CORS settings in Supabase for your domain

### 3. Monitoring
- Check application logs regularly
- Monitor performance and errors
- Set up health checks

### 4. Backups
- Regular database backups via Supabase
- Code backups via Git
- Document your deployment configuration

## Troubleshooting

### Common Issues

1. **Application not loading**
   - Check environment variables are set correctly
   - Verify Supabase URL and key
   - Check network connectivity

2. **Build failures**
   - Ensure all dependencies are in package.json
   - Check Node.js version compatibility
   - Verify build commands

3. **Database connection errors**
   - Verify Supabase credentials
   - Check RLS policies
   - Ensure database is accessible

### Health Check
Access `/health` endpoint to verify the application is running correctly.

### Logs
```bash
# Docker logs
docker logs erp-system

# Docker Compose logs
docker-compose logs -f
```

## Updates

To update the application:

1. **EasyPanel**: Push changes to GitHub, redeploy in panel
2. **Docker**: Rebuild image and restart container
3. **Docker Compose**: `docker-compose pull && docker-compose up -d`