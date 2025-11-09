# SPA Segura com Spotify (OAuth 2.0 PKCE)

## 1. 📜 Descrição

Este projeto é uma Single Page Application (SPA) desenvolvida em JavaScript puro para a disciplina de Segurança.

O objetivo principal é implementar o fluxo de autenticação **OAuth 2.0 Authorization Code com PKCE (Proof Key for Code Exchange)**, conectando-se à API do Spotify. A aplicação demonstra controle de autorização seguro, alterando sua interface e funcionalidades com base nos escopos (permissões) concedidos pelo usuário.

## 2. ✨ Funcionalidades Implementadas

* **Fluxo PKCE Completo**:
    * Geração e HASH (SHA256) do `code_verifier` para criar o `code_challenge`.
    * Armazenamento seguro do `code_verifier` no `sessionStorage`.
    * Envio do `code_verifier` na troca do `code` pelo `access_token`.
* **Proteção CSRF**:
    * Geração e validação de um parâmetro `state` aleatório em todo o fluxo de autenticação.
* **Controle de Autorização (Scopes)**:
    * **Perfil Viewer**: Vê o que está tocando (`user-read-playback-state`).
    * **Perfil Manager**: Pode controlar o player (`user-modify-playback-state`).
    * A interface é renderizada condicionalmente com base nos escopos obtidos.
* **Armazenamento Seguro de Token**:
    * O `access_token` é armazenado apenas na memória da aplicação ou `sessionStorage`, **não** utilizando `localStorage`.
* **Logout Seguro**:
    * Limpa o token da memória/sessão local.
    * Redireciona para o `end_session_endpoint` do provedor para encerrar a sessão remota.
* **DevOps e CI/CD**:
    * Um workflow de GitHub Actions (`.github/workflows/deploy.yml`) faz o deploy automático para o GitHub Pages.
    * O `CLIENT_ID` não é *hardcoded*, mas sim injetado como variável de ambiente durante o *build*, utilizando GitHub Secrets.

## 3. 🛠️ Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript (Puro / Vanilla JS)
* Spotify Web API
* GitHub Actions
* GitHub Pages

## 4. 🚀 Como Executar

Existem duas formas de rodar o projeto: localmente (para testes) ou via deploy (produção).

### 4.1. Configuração Essencial (Spotify)

1.  Acesse o [Dashboard de Desenvolvedor do Spotify](http(s)://developer.spotify.com/dashboard).
2.  Crie um novo aplicativo e obtenha seu **Client ID**.
3.  Vá em "Edit Settings" e adicione os **Redirect URIs**:
    * Para teste local: `http://127.0.0.1:5500/` (ou a porta que seu servidor local usar).
    * Para produção: A URL do seu GitHub Pages (ex: `https://seu-usuario.github.io/seu-repositorio/`).

### 4.2. Execução Local

1.  Clone este repositório.
2.  Na raiz do projeto, crie um arquivo chamado `config.js`.
3.  Adicione seu Client ID a este arquivo:
    ```javascript
    const CLIENT_ID = "SEU_CLIENT_ID_COPIADO_DO_SPOTIFY";
    ```
4.  Inicie um servidor local na pasta (recomenda-se a extensão **Live Server** do VS Code).
