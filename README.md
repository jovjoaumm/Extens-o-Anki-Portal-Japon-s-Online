# PJO → Anki

Extensão para Chrome que injeta um botão nos cards do [Portal Japonês Online](https://portal.programajaponesonline.com.br) e os envia diretamente para o seu Anki Desktop, com escolha de deck na hora do envio.

---

## Pré-requisitos

| Requisito | O que é |
|---|---|
| [Anki Desktop](https://apps.ankiweb.net/) | Aplicativo de flashcards para PC (Windows/Mac/Linux) |
| AnkiConnect | Add-on que abre uma API local no Anki para receber cards |
| Google Chrome | Navegador onde a extensão roda |

---

## 1. Instalar o AnkiConnect no Anki Desktop

1. Abra o **Anki Desktop**
2. No menu superior, clique em **Ferramentas → Add-ons**
3. Clique em **Obter Add-ons...**
4. No campo de código, cole: `2055492159`
5. Clique em **OK** e aguarde o download
6. **Reinicie o Anki**

---

## 2. Configurar o CORS no AnkiConnect

Por padrão o AnkiConnect só aceita conexões do `localhost`. É preciso liberar o domínio do Portal Japonês Online.

1. Com o Anki aberto, vá em **Ferramentas → Add-ons**
2. Selecione **AnkiConnect** na lista e clique em **Config**
3. Substitua o conteúdo pela configuração abaixo (ou adicione a linha do PJO ao `webCorsOriginList` existente):

```json
{
    "apiKey": null,
    "apiLogPath": null,
    "ignoreOriginList": [],
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOriginList": [
        "http://localhost",
        "https://portal.programajaponesonline.com.br"
    ]
}
```

4. Clique em **OK** e **reinicie o Anki**

---

## 3. Instalar a extensão no Chrome

1. Baixe o arquivo `anki-pjo-extension.zip` na página de [Releases](../../releases) deste repositório
2. Extraia o ZIP em uma pasta fixa, por exemplo: `C:\Extensoes\anki-pjo`
   > **Importante:** não mova nem delete essa pasta depois, pois o Chrome carrega a extensão a partir dela
3. No Chrome, acesse `chrome://extensions/`
4. Ative o **Modo do desenvolvedor** (toggle no canto superior direito)
5. Clique em **Carregar sem compactação**
6. Selecione a pasta `anki-pjo` que você extraiu
7. A extensão aparecerá na lista com o nome **PJO → Anki**

---

## Como usar

1. Deixe o **Anki Desktop aberto** em segundo plano
2. Acesse qualquer lição no Portal Japonês Online
3. Clique no botão do card para abrir o modal da frase
4. Um botão azul **Anki** aparecerá dentro do modal
5. Clique no botão — um seletor de deck abrirá mostrando todos os seus decks
6. Escolha o deck e clique em **Enviar**
7. O card vai direto para o Anki — o botão ficará verde confirmando o sucesso

O último deck escolhido é lembrado automaticamente para o próximo card.

---

## Estados do botão

| Cor | Estado | Significado |
|---|---|---|
| Azul | Pronto | Aguardando clique |
| Cinza | Enviando… | Comunicando com o Anki |
| Verde | Adicionado! | Card salvo com sucesso |
| Vermelho | Erro | Veja a mensagem exibida |

---

## Solução de problemas

**"Anki fechado?"**
O Anki Desktop precisa estar aberto com o AnkiConnect instalado. Abra o Anki e tente novamente.

**Seletor de deck mostra "Anki fechado ou CORS não configurado"**
O CORS não foi configurado corretamente. Refaça o [passo 2](#2-configurar-o-cors-no-ankiconnect) e reinicie o Anki.

**"Duplicado"**
Esse card já existe no deck escolhido. O AnkiConnect bloqueia duplicatas por padrão.

**O botão "Anki" não aparece no card**
Recarregue a página. Se persistir, verifique em `chrome://extensions/` se a extensão está ativa.
