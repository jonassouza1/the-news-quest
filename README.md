# Comandos para iniciar o projeto

1 - instalar dependencias

```
npm install

```

2 - executar o software

```
npm  run dev

```

3 - executar os testes

```
npm  run test

```

## Aviso

- **1** deve estar com o docker instalado e em execução.

- **2** para acessar dashboard no projeto, é só digitar "/ dashboard" no fim da url. Não criei um botão na página incial que encaminharia direto, para não ficar muito aberto o acesso, mas fiz assim para facilitar o acesso de vocês sem ter um botão para o usuario normal acessar com facilidade.

# Relatório de Análise do Projeto

## 1. Stacks

### Tecnologias Utilizadas:

- **Frontend**: Next.js, React, CSS puro
- **Backend**: Node.js com Next.js API Routes, Express
- **Banco de Dados**: PostgreSQL
- **Infraestrutura**: Docker para ambiente de desenvolvimento
- **CI/CD**: GitHub Actions e Worker para execução de linting e testes automáticos
- **Qualidade de Código**: ESLint e Prettier
- **Requisições HTTP**: Axios no backend
- **Migrações e Modelagem do Banco**: Migrations com pg

### Problemas Enfrentados:

- **DashBoard**:Coloquei o dashboard junto no projeto sem restrição, mas tenho ciencia de que em um projeto real, só a plataforma deveria ter acesso.
- **Validação na busca de detalhes de post via Token**: O endpoint da API para busca de mais detalhes de post, usando o id como parâmetro, que foi retornado do corpo do endpoint que fazia o cadastro do email, exigia um token, mas o desafio não mencionava isso, então deixei essa parte em aberto para o recebimento do token "quando fosse criado".
- **Estruturação da Base de Dados**: Foi necessário projetar um esquema eficiente para armazenar os streaks e histórico de leituras.
- **Processamento dos Webhooks**: A plataforma envia dados periodicamente, então foi preciso garantir que a aplicação processasse e armazenasse corretamente as informações de leitura.
- **Inteligência Artificial (IA)**: Utilizei o chat GPT para me auxiliar na compreensão do desafio e na estruturação do código referente à solução.
- **Conclusão**:O projeto ainda não está rodando 100%, possivelmente devido a questões relacionadas ao token. Além disso, tive dificuldade para compreender as regras, pois nunca havia desenvolvido um projeto desse tipo antes.

## 2. Dados

### Estrutura SQL

O banco foi modelado para suportar o histórico de leituras e streaks dos usuários. Principais tabelas:

- **users**: Armazena emails dos leitores.
- **newsletters**: Guarda informações sobre cada edição da newsletter.
- **reads**: Registra cada vez que um usuário abre uma newsletter.
- **streaks**: Controla os streaks diários de leitura.

### Inserções e Consultas

Os webhooks são processados automaticamente para registrar novas leituras e atualizar os streaks dos usuários. O webhook realiza as seguintes operações:

1. **Cadastro ou recuperação do usuário**:

   ```sql
   INSERT INTO users (email)
   VALUES ($1)
   ON CONFLICT (email) DO NOTHING
   RETURNING id;
   ```

Se o usuário já existir, buscamos o ID com:

```sql
SELECT id FROM users WHERE email = $1;
```

2. **Registro da edição da newsletter**:

   ```sql
   INSERT INTO newsletters (edition_id, title, content, published_at, author)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (edition_id) DO UPDATE
   SET title = EXCLUDED.title,
       content = EXCLUDED.content,
       published_at = EXCLUDED.published_at,
       author = EXCLUDED.author
   RETURNING id;
   ```

3. **Registro de leitura**:

   ```sql
   INSERT INTO reads (user_id, newsletter_id, read_at)
   VALUES ($1, $2, NOW());
   ```

   Antes de registrar, verificamos se o usuário já leu a newsletter no mesmo dia:

   ```sql
   SELECT 1 FROM reads WHERE user_id = $1 AND read_at >= $2 LIMIT 1;
   ```

4. **Atualização do streak**:
   ```sql
   INSERT INTO streaks (user_id, streak_count, last_read_at)
   VALUES ($1, 1, NOW())
   ON CONFLICT (user_id) DO UPDATE
   SET streak_count = CASE
       WHEN streaks.last_read_at >= NOW() - INTERVAL '1 day' THEN streaks.streak_count + 1
       ELSE 1
   END,
   last_read_at = NOW()
   RETURNING streak_count;
   ```

### Escalabilidade

O banco de dados foi estruturado de forma a suportar alto volume de leituras e consultas. Algumas decisões que garantem a escalabilidade:

- **Uso de índices**: Índices foram aplicados nas colunas mais consultadas, como `email` em `users` e `edition_id` em `newsletters`, melhorando a velocidade de busca.
- **Armazenação normalizada**: Evita redundância de dados e melhora a integridade das informações.
- **Particionamento futuro**: Se necessário, podemos dividir a tabela `reads` por mês para otimizar a performance.
- **Docker**: Facilita a implantação e permite escalar a aplicação horizontalmente.

## 3. Testes

### Testes Realizados:

- **Infraestrutura**: Validação da integridade do banco de dados.
- **Backend**: Testes nos endpoints para garantir respostas claras e tratamento adequado de erros.
- **CI/CD**: Implementação de linting e execução de testes automáticos a cada commit.

### Tempo de Desenvolvimento:

- Implementação: Aproximadamente 7 dias
- Testes e Ajustes: 1 dias
- Documentação e ajustes finais: 3 dia

## 4. Funcionalidades Implementadas

### **Área de Login para Leitores**

- Login via email.
- Exibição do streak atual.
- Histórico de leituras.
- Mensagens motivacionais.

### **Dashboard Administrativo**

- Métricas de engajamento.
- Ranking dos leitores mais engajados.
- Filtros por newsletter, período e status do streak.
- Gráficos de engajamento.

### **Regras de Streak**

- O streak aumenta +1 a cada dia consecutivo de leitura.
- Considera que não há edição aos domingos.

---

Este relatório resume as principais decisões técnicas, desafios e soluções aplicadas no desenvolvimento do projeto.

```

```
