Checklist dos Pisos

Um aplicativo web responsivo para criação de checklists de pisos, com autenticação simples e armazenamento local (localStorage). O projeto permite que cada usuário tenha seu próprio checklist e oferece funcionalidades como:

    Login/Registro de Usuários:
    Usuários podem acessar o sistema utilizando credenciais. São inicializados quatro usuários padrão com senhas criptografadas (hash SHA‑256).
    Checklist Dinâmico:
    Adicione, edite e remova linhas de checklist, com campos para Data, Piso, Posição e Observação.
    Exportação para Excel:
    Exporte o conteúdo do checklist para um arquivo Excel utilizando a biblioteca SheetJS.
    Responsividade:
    Layout adaptado para dispositivos móveis com Bootstrap, garantindo que todos os campos fiquem visíveis e utilizáveis mesmo em telas pequenas.
    Interface Tech:
    Visual moderno com tema tech (gradiente, glassmorphism e cores neon) para uma experiência diferenciada.

Tecnologias Utilizadas

    HTML5, CSS3 e JavaScript:
    Estrutura e interatividade da aplicação.
    Bootstrap 4:
    Responsividade e estilos.
    SheetJS (xlsx):
    Geração e exportação do arquivo Excel.
    Web Crypto API:
    Para gerar o hash SHA‑256 das senhas.
    LocalStorage e SessionStorage:
    Armazenamento dos dados do checklist e credenciais de login no lado do cliente.

Como Utilizar

    Clone o repositório:

    git clone https://github.com/lucasevangelis/checklist-dos-pisos.git
    cd checklist-dos-pisos

    Abra o projeto:

    Você pode abrir o arquivo index.html diretamente em seu navegador. Recomenda-se utilizar um servidor local (por exemplo, Live Server para VS Code) para melhor experiência.

    Login:
        Na primeira vez que acessar, você verá a tela de login.
        Caso o usuário não exista, você poderá registrá-lo diretamente.

    Uso do Checklist:
        Após o login, você terá acesso ao checklist.
        Adicione novas linhas utilizando o botão "Adicionar Linha".
        Preencha os campos:
            Data: Selecione a data desejada.
            Piso: Selecione o piso (as opções são: 2, 3, 4, 5 e 6).
            Nota: No celular, o campo foi ajustado para que o valor fique visível.
            Posição: Apenas números são permitidos.
            Observação: A primeira letra é convertida automaticamente para maiúscula.
        Salve os dados automaticamente (armazenados no localStorage) e veja um ícone "Salvo!" no canto superior direito.
        Exporte o checklist para Excel clicando no botão "Exportar para Excel".

Configuração de Variáveis de Ambiente no Netlify

Caso você deseje utilizar variáveis de ambiente (por exemplo, para os usuários padrão) e evitar subir o arquivo .env, defina-as diretamente no painel do Netlify:

    Acesse app.netlify.com e entre na sua conta.
    Selecione o site e vá em Site settings.


Estrutura do Projeto

checklist-dos-pisos/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   └── images/
│       └── floor_icon.png
└── .gitignore

    index.html: Estrutura principal da aplicação.
    css/style.css: Estilos customizados e ajustes responsivos.
    js/script.js: Lógica de autenticação, gerenciamento do checklist e exportação para Excel.
    assets/images: Contém o favicon (ícone da aba do navegador).

Contribuições

Sinta-se à vontade para abrir issues ou enviar pull requests para melhorar a aplicação.
