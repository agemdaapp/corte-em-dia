# 1. Identificação do Projeto

## 1.1 Nome do Sistema

**Nome do sistema:** Corte em Dia  

O sistema **Corte em Dia** foi pensado para atender salões de beleza e cabeleireiros que precisam organizar melhor seus agendamentos. O nome remete à ideia de manter o cliente sempre “em dia” com o corte, coloração ou tratamento, reforçando a proposta de praticidade e organização tanto para o profissional quanto para o cliente.

Além disso, é um nome curto, fácil de lembrar e pronunciar, mantendo um tom profissional e diretamente relacionado ao contexto de agendamento de serviços de cabelo e estética.

---

## 1.2 Integrantes do Grupo

- **Matheus Viana Dantas** – Responsável pelo **Front-end Web** e apoio na versão **PWA**  
- **Guilherme Soares Ferreira** – Responsável pela **integração com o Back-end/Supabase** e **modelagem de dados**

---

# 2. Apresentação do Projeto

## 2.1 Objetivo do Sistema

O sistema **Corte em Dia** tem como objetivo centralizar e automatizar o processo de agendamento de serviços em um salão de beleza ou cabeleireiro, como corte de cabelo, progressiva, luzes, coloração, alongamento, entre outros.  

Através da versão **web**, o profissional poderá administrar a agenda, cadastrar serviços com durações diferentes, acompanhar os horários disponíveis e visualizar de forma organizada o fluxo do dia.  

A versão **mobile em formato PWA** será voltada principalmente para os clientes, permitindo que consultem horários disponíveis, escolham o serviço desejado e realizem o agendamento diretamente pelo celular. As duas versões utilizam a mesma base de dados, garantindo atualização em tempo real e evitando conflitos de agenda.

---

## 2.2 Problema Identificado (A Dor)

Atualmente, muitos cabeleireiros e salões de bairro organizam seus horários de forma manual, utilizando agenda de papel, bloco de notas, conversas no WhatsApp ou simples “lembranças de cabeça”. Esse modelo aumenta a chance de erros, como marcação duplicada, esquecimentos de clientes, falhas na comunicação sobre atrasos e dificuldade em visualizar o tempo real disponível para cada tipo de serviço, gerando desorganização e perda potencial de clientes.

O público-alvo principal são **cabeleireiros autônomos e pequenos salões de beleza** que oferecem serviços variados (cortes, químicas, tratamentos, etc.) e possuem agenda relativamente cheia, mas não contam com um sistema especializado. Hoje, muitos utilizam apenas WhatsApp para combinar horários, o que depende de respostas manuais e não possui cálculo automático da duração dos serviços. Outros utilizam aplicativos genéricos de agenda, que não consideram as particularidades de serviços de beleza com tempos diferentes.

A solução proposta se destaca por trabalhar com **serviços pré-definidos com duração estimada**, permitindo que o sistema calcule automaticamente quais horários realmente comportam o serviço escolhido pelo cliente. Se o salão tem um intervalo livre de 14h30 às 15h30, por exemplo, apenas serviços com duração compatível serão exibidos como disponíveis. Isso reduz erros, evita promessas de horários inviáveis e melhora a experiência de uso.

A existência de uma **versão web** é importante para o profissional, que normalmente gerencia a agenda em um computador ou notebook, com visão mais ampla do dia, da semana e dos serviços cadastrados. Já a **versão mobile em PWA** é essencial para os clientes, que costumam agendar pelo celular, em diferentes momentos e locais, precisando de acesso rápido e sem necessidade de instalar um aplicativo nativo. As duas versões se complementam para garantir organização ao salão e praticidade ao cliente.

---

## 2.3 Stack Tecnológica

### 2.3.1 Front-end Web

- **Framework/Linguagem:** React.js  
- **Biblioteca de UI:** Material UI (MUI)  
- **Roteamento:** React Router  
- **Consumo de API:** Axios  

**Justificativa:**  
O React.js é amplamente utilizado no mercado e baseado em componentes, facilitando a reutilização e manutenção do código. A equipe já possui familiaridade com React, reduzindo a curva de aprendizado. O Material UI oferece componentes prontos, responsivos e com design profissional, acelerando o desenvolvimento e garantindo consistência visual.  

O **React Router** será utilizado para gerenciar a navegação entre as páginas principais (login, agenda, serviços, clientes), proporcionando uma experiência de SPA (Single Page Application).  

O **Axios** será utilizado para consumir as APIs fornecidas pelo back-end (Supabase), padronizando chamadas HTTP e o tratamento de respostas e erros.

---

### 2.3.2 Versão Mobile (PWA)

- **Tecnologia base:** React.js (reaproveitando boa parte da base do front-end web)  
- **Recursos de PWA:**
  - Service Workers para cache básico e funcionamento com conexão instável.
  - Web App Manifest para permitir a instalação do sistema na tela inicial do celular.

**Justificativa da escolha PWA:**  
O sistema é focado em formulários, listagem e agendamento de horários, sem necessidade de recursos nativos avançados (câmera, GPS, sensores). A abordagem PWA permite reaproveitar código da versão web, reduzindo tempo de desenvolvimento e facilitando a manutenção.  

O usuário consegue “instalar” o sistema no celular sem passar por lojas de aplicativos, simplificando a distribuição e o acesso.

---

### 2.3.3 Back-end

- **Banco de Dados e BaaS:** Supabase (PostgreSQL)  
- **Tipo de API:** REST  
- **Autenticação:** Supabase Auth  
- **Armazenamento de arquivos (opcional):** Supabase Storage  

**Justificativa:**  
O Supabase fornece um banco de dados **PostgreSQL** com geração automática de **APIs REST**, facilitando o desenvolvimento da camada de back-end. O front-end (web e PWA) consome essas APIs usando JavaScript e Axios, mantendo a stack unificada.  

O **Supabase Auth** será utilizado para gerenciar autenticação e autorização de usuários, permitindo controle de acesso para cabeleireiros e, se desejado, para clientes. O **Supabase Storage** poderá ser usado para armazenar arquivos relacionados ao sistema, como logotipos do salão.  

Se necessário, o Supabase oferece ainda funções, políticas de segurança (RLS) e Edge Functions em JavaScript/TypeScript, sem a necessidade inicial de um servidor dedicado. A API REST atende bem ao modelo de CRUD para agendamentos, clientes e serviços.

---

# 3. Arquitetura e Fluxo do Sistema

## 3.1 Mapa de Telas

A seguir são apresentadas as principais telas previstas para o sistema **Corte em Dia**. A estrutura poderá ser refinada na Etapa 2 conforme as necessidades identificadas no desenvolvimento.

- **Tela 1: Login**  
  - **Versão:** Web e Mobile (PWA)  
  - **Objetivo:** Permitir o acesso de cabeleireiros e clientes.  
  - **Resumo:** Campos de e-mail e senha, botão de entrada, opção de recuperação de senha e, opcionalmente, acesso ao cadastro de cliente.

- **Tela 2: Agenda do Dia (Profissional)**  
  - **Versão:** Web  
  - **Objetivo:** Exibir os agendamentos do dia e os horários livres para o cabeleireiro.  
  - **Resumo:** Visualização da agenda por dia, horários ocupados/livres e acesso para criar, editar ou cancelar agendamentos.

- **Tela 3: Gestão de Serviços**  
  - **Versão:** Web  
  - **Objetivo:** Cadastrar e gerenciar os serviços oferecidos e suas durações estimadas.  
  - **Resumo:** Lista de serviços e formulário de criação/edição (nome, duração etc.).

- **Tela 4: Gestão de Clientes / Cadastro de Cliente**  
  - **Versão:** Web e Mobile (PWA, em versão simplificada)  
  - **Objetivo:** Manter os dados básicos dos clientes e permitir cadastro quando necessário.  
  - **Resumo:** Lista ou busca de clientes (no Web) e formulário de cadastro/edição (nome, e-mail, telefone etc.).

- **Tela 5: Escolha de Serviço (Cliente)**  
  - **Versão:** Mobile (PWA)  
  - **Objetivo:** Permitir que o cliente selecione o serviço que deseja agendar.  
  - **Resumo:** Lista de serviços disponíveis com sua duração estimada e ação para avançar à escolha de data e horário.

- **Tela 6: Seleção de Data e Horário (Cliente)**  
  - **Versão:** Mobile (PWA)  
  - **Objetivo:** Mostrar ao cliente os horários disponíveis compatíveis com o serviço escolhido.  
  - **Resumo:** Seleção de data e exibição de horários disponíveis já filtrados de acordo com a duração do serviço.

- **Tela 7: Meus Agendamentos (Cliente)**  
  - **Versão:** Mobile (PWA)  
  - **Objetivo:** Permitir que o cliente visualize seus agendamentos futuros e, se permitido, cancele algum deles.  
  - **Resumo:** Lista de agendamentos com data, horário e serviço, opção de ver detalhes, cancelar e iniciar novo agendamento.

---

## 3.2 Fluxograma de Navegação

A navegação do sistema é organizada em fluxos principais separados por tipo de usuário.

### 3.2.1 Fluxo – Profissional (Web)

- **Login (Tela 1)**  
  → Usuário cabeleireiro se autentica  
  → Redirecionamento para **Agenda do Dia (Tela 2)**  

- **Agenda do Dia (Tela 2)**  
  → Visualiza agendamentos e horários livres  
  → Pode:
  - Criar novo agendamento manual em um horário livre  
  - Acessar detalhes/edição de um agendamento existente  
  - Navegar para:
    - **Gestão de Serviços (Tela 3)**  
    - **Gestão de Clientes (Tela 4)**  

- **Gestão de Serviços (Tela 3)**  
  → Cadastrar/editar/excluir serviços  
  → Retornar para **Agenda do Dia (Tela 2)**  

- **Gestão de Clientes (Tela 4 – Web)**  
  → Visualizar e editar dados de clientes, cadastrar novos  
  → Retornar para **Agenda do Dia (Tela 2)**  

Em qualquer momento, o profissional poderá sair do sistema e voltar à **Tela 1 (Login)**.

---

### 3.2.2 Fluxo – Cliente (Mobile/PWA)

- **Login (Tela 1)**  
  → Cliente se autentica (ou acessa fluxo de cadastro, quando disponível)  
  → Redirecionamento para **Escolha de Serviço (Tela 5)**  

- **Escolha de Serviço (Tela 5)**  
  → Cliente seleciona o serviço desejado  
  → Avança para **Seleção de Data e Horário (Tela 6)**  

- **Seleção de Data e Horário (Tela 6)**  
  → Cliente escolhe a data  
  → Sistema exibe apenas horários compatíveis com a duração do serviço  
  → Cliente escolhe um horário disponível  
  → Confirma → criação do agendamento no sistema  
  → Redirecionamento para **Meus Agendamentos (Tela 7)**  

- **Meus Agendamentos (Tela 7)**  
  → Cliente visualiza seus agendamentos futuros  
  → Pode, conforme regras definidas, cancelar algum agendamento  
  → Pode iniciar um novo agendamento, retornando para **Tela 5 (Escolha de Serviço)**

---

### 3.2.3 Fluxo de Cadastro de Cliente (Opcional)

Caso o sistema permita que o próprio cliente crie sua conta:

- **Login (Tela 1)**  
  → Clique em “Criar conta”  
  → Redirecionamento para **Cadastro de Cliente (Tela 4 – Mobile)**  
  → Após o cadastro bem-sucedido, o cliente é redirecionado para o fluxo principal de agendamento, iniciando em **Escolha de Serviço (Tela 5)**.

---

# 4. Funcionalidades Detalhadas

As funcionalidades do sistema **Corte em Dia** foram organizadas em três níveis de prioridade:

- **Essenciais (MVP):** necessárias para o funcionamento básico.  
- **Importantes:** agregam valor e melhoram a experiência.  
- **Desejáveis:** podem ser implementadas se houver tempo (melhorias futuras).

Abaixo estão descritas as funcionalidades com foco em **nome**, **descrição resumida**, **telas envolvidas** e **versões**. Detalhes técnicos mais finos poderão ser ajustados na Etapa 2.

---

## 4.1 Funcionalidades Essenciais (MVP)

1. **Login de Usuário (Profissional e Cliente)**  
   - **Descrição:** Autenticação de usuários (cabeleireiros e clientes), garantindo acesso aos fluxos adequados.  
   - **Telas envolvidas:** Tela 1 – Login  
   - **Versões:** Web e Mobile (PWA)

2. **Cadastro e Gestão de Serviços**  
   - **Descrição:** Cadastro, edição e exclusão de serviços oferecidos (ex.: corte, progressiva, luzes), incluindo duração estimada.  
   - **Telas envolvidas:** Tela 3 – Gestão de Serviços  
   - **Versões:** Web

3. **Cadastro Básico de Clientes**  
   - **Descrição:** Registro de dados básicos de clientes (nome, e-mail, telefone), para uso nos agendamentos e contato.  
   - **Telas envolvidas:** Tela 4 – Gestão de Clientes / Cadastro de Cliente  
   - **Versões:** Web e, de forma simplificada, Mobile (PWA)

4. **Agendamento de Serviço com Cálculo Automático de Horário (Cliente)**  
   - **Descrição:** Permite ao cliente agendar um serviço, exibindo apenas horários compatíveis com a duração do serviço escolhido.  
   - **Telas envolvidas:** Tela 5 – Escolha de Serviço; Tela 6 – Seleção de Data e Horário  
   - **Versões:** Mobile (PWA)

5. **Criação de Agendamento no Banco de Dados**  
   - **Descrição:** Registro do agendamento (cliente, serviço, data, horário de início e término) no Supabase após confirmação.  
   - **Telas envolvidas:** Fluxo de confirmação dentro da Seleção de Data e Horário  
   - **Versões:** Mobile (PWA), com reflexo na Web (Agenda do Dia)

6. **Visualização da Agenda do Dia (Profissional)**  
   - **Descrição:** Exibição dos agendamentos do dia e horários livres para o cabeleireiro.  
   - **Telas envolvidas:** Tela 2 – Agenda do Dia  
   - **Versões:** Web

7. **Meus Agendamentos (Cliente)**  
   - **Descrição:** Lista de agendamentos futuros do cliente, com informações de serviço, data e horário.  
   - **Telas envolvidas:** Tela 7 – Meus Agendamentos  
   - **Versões:** Mobile (PWA)

---

## 4.2 Funcionalidades Importantes

8. **Edição e Cancelamento de Agendamentos (Profissional)**  
   - **Descrição:** Permite ao cabeleireiro ajustar ou cancelar agendamentos já criados, liberando o horário quando necessário.  
   - **Telas envolvidas:** Tela 2 – Agenda do Dia (e/ou tela de detalhes de agendamento)  
   - **Versões:** Web

9. **Cancelamento de Agendamento pelo Cliente (com regras de antecedência)**  
   - **Descrição:** Permite que o cliente cancele seus agendamentos, respeitando regras de antecedência definidas.  
   - **Telas envolvidas:** Tela 7 – Meus Agendamentos  
   - **Versões:** Mobile (PWA)

10. **Recuperação de Senha**  
    - **Descrição:** Recuperação de acesso ao sistema por meio de link de redefinição de senha via e-mail (Supabase Auth).  
    - **Telas envolvidas:** Tela 1 – Login (fluxo “Esqueci minha senha”)  
    - **Versões:** Web e Mobile (PWA)

11. **Filtros e Navegação por Data na Agenda (Profissional)**  
    - **Descrição:** Navegação entre dias (anterior/próximo) e filtros simples na agenda, facilitando a visualização da carga de trabalho.  
    - **Telas envolvidas:** Tela 2 – Agenda do Dia  
    - **Versões:** Web

---

## 4.3 Funcionalidades Desejáveis (Melhorias Futuras)

*(Opcional, dependendo do tempo disponível na Etapa 2.)*

- **Notificações por e-mail ou mensagem como lembrete de agendamento**  
- **Notificações push (PWA)**  
- **Relatórios simples para o profissional (serviços mais realizados, volume por período)**  
- **Suporte a múltiplos profissionais (multi-cabeleireiro) no mesmo salão**

---

# 5. Considerações de UX/UI

## 5.1 Identidade Visual

A identidade visual do **Corte em Dia** será simples, moderna e alinhada ao contexto de salões de beleza. Inicialmente, pretende-se utilizar uma paleta com tons claros e um destaque principal em azul ou roxo suave, combinados com branco e cinza para garantir boa legibilidade. As cores poderão ser ajustadas posteriormente de acordo com a preferência do salão que utilizar o sistema.

Para tipografia, a ideia é utilizar fontes sem serifa, como **Roboto** ou similar, por apresentarem boa leitura em telas pequenas e grandes. Títulos e elementos de destaque utilizarão pesos mais fortes, enquanto textos de apoio terão peso regular.

O uso do **Material UI (MUI)** auxiliará a manter consistência visual entre componentes (botões, campos de formulário, diálogos, navegação), com foco na clareza das informações de horário, serviço e status dos agendamentos.

---

## 5.2 Responsividade

A versão web do **Corte em Dia** será desenvolvida com foco em layout responsivo, adaptando-se a diferentes resoluções de tela:

- **Desktop:** prioriza a visualização da agenda do dia em maior área.  
- **Tablets e telas intermediárias:** mantém as mesmas funcionalidades com reorganização de layout (colunas reduzidas, menus recolhidos etc.).  
- **Mobile:** embora exista o PWA como versão principal para o cliente, a aplicação web também será utilizável em telas menores, com ajustes de espaçamento, tamanho de fonte e componentes amigáveis ao toque.

Serão adotados breakpoints compatíveis com o comportamento padrão do Material UI, permitindo que a interface se reorganize automaticamente conforme a largura da tela.

---

## 5.3 Diferenças de Experiência entre Web e Mobile/PWA

- **Versão Web (Profissional):**
  - Focada na gestão da agenda, serviços e clientes.  
  - Aproveita o espaço de tela maior para exibir mais informações simultaneamente (agenda do dia, menus laterais/superiores).  
  - Interações pensadas para uso com teclado e mouse, otimizando a produtividade no dia a dia do salão.

- **Versão Mobile/PWA (Cliente):**
  - Focada em consulta de horários, agendamento e visualização de “Meus Agendamentos”.  
  - Interface simplificada, com passos em sequência (escolher serviço → escolher data/horário → confirmar).  
  - Navegação otimizada para toque, com botões maiores e menos elementos por tela.  
  - Possibilidade de instalação do PWA na tela inicial do celular, com comportamento semelhante a um aplicativo nativo.

O objetivo é que ambas as versões compartilhem a mesma identidade visual, adaptando apenas os fluxos às necessidades de cada tipo de usuário.

---

# 6. Cronograma de Desenvolvimento

O cronograma abaixo apresenta uma previsão geral para a **Etapa 2 (desenvolvimento)** do sistema **Corte em Dia**, podendo sofrer ajustes conforme o andamento do projeto.

| Período                   | Atividade                                                                                  | Responsável                                  |
|---------------------------|--------------------------------------------------------------------------------------------|----------------------------------------------|
| 02/12/2025 - 15/12/2025   | Definição detalhada de requisitos, ajustes na documentação e criação de wireframes/protótipos | Dupla                                        |
| 16/12/2025 - 05/01/2026   | Configuração do ambiente, criação do projeto React, integração inicial com Supabase (auth e banco) | Dupla (com foco em back-end/configuração)    |
| 06/01/2026 - 20/01/2026   | Desenvolvimento das principais telas e funcionalidades da versão Web (login, agenda, serviços, clientes) | Principalmente Matheus, com apoio de Guilherme |
| 06/01/2026 - 20/01/2026   | Adaptação para PWA e implementação dos fluxos principais do cliente (escolha de serviço, horários, meus agendamentos) | Principalmente Guilherme, com apoio de Matheus |
| 21/01/2026 - 28/01/2026   | Integração completa, testes básicos dos fluxos de agendamento, ajustes de UX/UI e correção de bugs | Dupla                                        |
| 29/01/2026 - 01/02/2026   | Refinos finais, preparação da apresentação e atualização da documentação com o sistema implementado | Dupla                                        |

O cronograma reserva tempo para:

- Configuração técnica inicial;  
- Desenvolvimento das funcionalidades essenciais;  
- Integração entre Web e PWA;  
- Testes e ajustes finais antes da apresentação.
