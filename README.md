# LanternFox 🦊 - Aplicação Web

![Banner do Projeto](https://i.imgur.com/yP85i9I.png)

## 📜 Sobre a Aplicação Web

Esta é a interface web do projeto **LanternFox**, um e-commerce completo com marketplace integrado. A aplicação foi desenvolvida utilizando tecnologias web fundamentais (HTML, CSS, JavaScript) e consome um backend robusto construído na plataforma Supabase.

O site serve como o portal principal da marca, permitindo aos usuários navegar pela loja, gerenciar suas contas, participar do marketplace e utilizar a funcionalidade exclusiva de troca de produtos.

---

## ✨ Funcionalidades Implementadas

- **Design Moderno e Responsivo:** Interface com identidade visual forte, tema claro/escuro e adaptável para diferentes tamanhos de tela.
- **Página Inicial Dinâmica:** Apresenta um banner com vídeo, carrossel de departamentos, seções de ofertas e lançamentos para engajar o usuário.
- **Autenticação Segura:** Suporte para registro/login com e-mail/senha e login social via Google (OAuth).
- **Navegação e Busca:** Páginas de detalhes para produtos e anúncios, e uma página de resultados de busca dedicada com filtros por texto e categoria.
- **E-commerce Completo:** Carrinho de compras interativo e um fluxo de checkout simulado com página de sucesso.
- **Marketplace C2C:** Usuários podem criar seus próprios anúncios, com upload de imagem para o Supabase Storage.
- **Sistema de Troca:** Funcionalidade que permite ao usuário oferecer um de seus anúncios como "entrada" na compra de um produto da loja.
- **Área do Cliente:**
  - **Meu Perfil:** Permite ao usuário visualizar e editar suas informações, incluindo o upload de um novo avatar.
  - **Meus Pedidos:** Histórico de todas as compras realizadas.
  - **Meus Anúncios:** Gerenciamento dos anúncios criados pelo usuário.
- **UX Refinada:** O site conta com animações sutis, notificações "toast" para feedback, indicador de scroll e foco em acessibilidade.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Para a estrutura semântica das páginas.
- **CSS3:** Para estilização, layout com Flexbox e Grid, animações e responsividade.
- **JavaScript (Vanilla JS):** Toda a lógica da aplicação foi construída com JavaScript puro, utilizando **Módulos ES6** para organização e manutenibilidade do código.
- **Supabase.js:** SDK oficial do Supabase para interagir com o backend, realizar chamadas à API, autenticar usuários e fazer upload de arquivos.
- **Font Awesome:** Para a biblioteca de ícones.

**Backend:** A aplicação consome uma API RESTful e em tempo real provida pelo **Supabase**, que gerencia o banco de dados (PostgreSQL), autenticação, storage de arquivos e regras de segurança.

---

## 🚀 Como Executar

### Pré-requisitos
- Uma conta e um projeto configurado no [Supabase](https://supabase.com).
- Um servidor web local para servir os arquivos estáticos (a extensão **Live Server** para VS Code é recomendada).

### Configuração

1.  **Configure o Backend:** Certifique-se de que seu projeto Supabase está com as tabelas, policies e triggers necessários para a aplicação funcionar.

2.  **Configure as Chaves da API:**
    - Abra o arquivo `js/config/supabaseClient.js`.
    - Substitua as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` pelas chaves correspondentes do seu projeto Supabase.

3.  **Configure o Login com Google (OAuth):**
    - No painel do Supabase (Authentication > URL Configuration), adicione a URL do seu servidor local (ex: `http://127.0.0.1:5500`) à lista de **Redirect URLs**.
    - No painel do Google Cloud, adicione a mesma URL à lista de "Origens JavaScript autorizadas" e "URIs de redirecionamento autorizados".

4.  **Execute o Servidor:**
    - Usando a extensão Live Server no VS Code, clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server".

---

## 👨‍💻 Autor

- **[Daniel]** - [shwdaniel7](https://github.com/shwdaniel7)