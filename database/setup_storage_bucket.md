# 📦 Criar Bucket no Supabase Storage

## Passo a Passo:

### 1. Acesse o Supabase Dashboard
https://supabase.com/dashboard

### 2. Selecione seu projeto

### 3. Vá em "Storage" (menu lateral esquerdo)

### 4. Clique em "Create a new bucket"

### 5. Configure o bucket:
- **Name**: `nexus-documents`
- **Public bucket**: ❌ Desmarque (privado)
- **File size limit**: 50 MB
- **Allowed MIME types**: Deixe vazio (aceita todos)

### 6. Clique em "Create bucket"

### 7. Configure as políticas de acesso (RLS):

Vá na aba **Policies** do bucket e adicione:

#### Policy 1: Allow authenticated uploads
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nexus-documents');
```

#### Policy 2: Allow authenticated reads
```sql
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'nexus-documents');
```

#### Policy 3: Allow authenticated deletes
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'nexus-documents');
```

---

## ⚠️ Alternativa Simples (Sem Storage):

Se você não quiser usar o Supabase Storage agora, podemos **desabilitar o upload de arquivos** temporariamente e focar apenas em:
- Upload de URLs (crawler)
- Processar texto direto

Qual você prefere?
1. Criar o bucket agora (recomendado)
2. Desabilitar upload de arquivos temporariamente
